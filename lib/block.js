/**
 * Abstract audio block.
 * Provides inputs/outputs and connection interface.
 * Manages connections, in that lab knows nothing about connection class.
 */


var Emitter = require('events');
var domify = require('domify');
var hasDom = require('has-dom');
var Dialog = require('dialog-component');
var Connection = require('./connection');
var JSON = require('json3');
var offset = require('mucss/offset');
var delegate = require('emmy/delegate');
var on = require('emmy/on');
var off = require('emmy/off');
var once = require('emmy/once');
var css = require('mucss/css');
var extend = require('xtend/mutable');
var win = require('global/window');
var selection = require('mucss/selection');
var q = require('queried');
var defineState = require('define-state');
var getUid = require('get-uid');


/**
 * Create an empty block
 *
 * @constructor
 */
class Block extends Emitter {
	constructor (options) {
		super();

		var self = this;

		//create unique id
		self.id = getUid();

		//take over passed options (probably redefine id)
		extend(self, options);

		//create DOM representation
		self.createElement();

		//reflect state
		defineState(self, 'state', self.state);
		self.state = 'loading';

		//keep outputs set
		self.outputs = new Set();
		self.inputs = new Set();

		//save instance on element
		self.element.block = self;

		//update position
		css(self.element, {
			top: self.top,
			left: self.left
		});

		//rerender
		self.update();


		//should be done in specific class
		// self.state = 'ready';
	}


	/**
 * Construct DOM representation
	 */
	createElement () {
		var self = this;

		if (!hasDom) return;

		self.element = domify(`
			<div class="block block-${ self.constructor.name.toLowerCase() }" data-block
				tabindex="1"
				title="${ self.constructor.name.toLowerCase() }">
				<div class="block-thumbnail" data-block-thumbnail data-block-handle>${ self.thumbnailTpl }</div>
				<div class="block-content" data-block-content>${ self.contentTpl }</div>
				<div class="block-out" data-block-output></div>
				<div class="block-in" data-block-input></div>
			</div>
		`);

		//show dialog on click
		self.content = q('[data-block-content]', self.element);

		if (!self.content) throw Error('Block has no content element');

		self.element.removeChild(self.content);
		self.dialog = new Dialog(self.content);
		self.dialog.escapable().closable().effect('fade');

		on(self.element, 'dblclick', function (e) {
			self.show();
		});

		self.thumbnail = q('[data-block-thumbnail]', self.element);


		//focus on click
		on(self.element, 'mousedown.' + self.id, function () {
			self.element.focus();
		});

		//handle keypresses
		on(self.element, 'keydown.' + self.id, function (e) {
			//delete by delete
			if (e.which === 46) {
				self.destroy();
			}

			//unfocus by escape
			if (e.which === 27) {
				self.element.blur();
			}

			//change volume by arrow
			//move by ctrl+arrow
			if (e.which === 38 || e.which === 40 || e.which === 37 || e.which === 39) {

			}

			//show dialog by enter
			if (e.which === 13) {
				self.show();
			}
		});

		//create new connection
		delegate(self.element, 'mousedown.' + self.id, '[data-block-output]', function (e) {
			new Connection(self);
		});

		return self;
	};


	/**
	 * Destruct self
	 */
	destroy () {
		var self = this;

		//delete connections
		self.outputs.forEach(function (conn) {
			conn.destroy();
		});
		self.inputs.forEach(function (conn) {
			conn.destroy();
		});

		off(self.element, '.' + self.id);

		//clear reference
		self.element.block = null;
		self.element = null;
	};


	/**
	 * Reveal in DOM settings dialog
	 */
	show () {
		var self = this;

		if (!hasDom) return self;

		self.dialog.show();
		self.dialog.el.focus();

		self.emit('show');
		return self;
	};



	/**
	 * Remove from DOM, go underground
	 */
	hide () {
		var self = this;

		if (!hasDom) return self;

		self.dialog.hide();

		self.emit('hide');
		return self;
	};



	/**
	 * Update node size, position and connections
	 *
	 * @return {Block} Return self
	 */
	update () {
		var self = this;

		//check need to hide input/output
		if (self.numberOfInputs > self.inputs.size) {
			self.element.setAttribute('data-block-potential-target', true);
			// self.element.classList.add('block-potential-target');
		} else {
			self.element.removeAttribute('data-block-potential-target');
			// self.element.classList.remove('block-potential-target');
		}
		if (self.numberOfOutputs > self.outputs.size) {
			self.element.setAttribute('data-block-potential-source', true);
			self.element.classList.add('block-potential-source');
		} else {
			self.element.removeAttribute('data-block-potential-source');
			self.element.classList.remove('block-potential-source');
		}

		self.emit('update');
		return self;
	};



	/**
	 * Connect block to another block
	 *
	 * @return {Block} Return self
	 */
	connect (block) {
		var self = this;

		//ignore new connection
		if (self.outputs.size >= self.numberOfOutputs) return self;
		if (block.inputs.size >= block.numberOfInputs) return self;

		//create connection
		var connection = new Connection(self, block);

		self.emit('connect');
		return self;
	};


	/**
	 * Disconnect node from other block
	 *
	 * @return {Block} Return self
	 */
	disconnect (target) {
		var self = this;

		self.outputs.forEach(function (conn) {
			//find connection where in = self, out = to
			if (!target || conn.to === target) {
				self.outputs.delete(conn);
				target.inputs.delete(conn);
			}
		});

		self.emit('disconnect');
		return self;
	};


	/**
	 * Start generating sound
	 *
	 * @return {Block} Return self
	 */
	start () {
		var self = this;

		if (self.isActive) return self;

		self.isActive = true;

		if (self.node) {
			//connect dependent nodes first
			self.outputs.forEach(function (connection) {
				connection.to.start();

				//connect each node
				connection.from.node.connect(connection.to.node);
			});
		}

		if (self.node && self.node.start) {
			try {
				self.node.start();
			} catch (e) {
				console.log(e.message)
			}
		}

		self.emit('start');

		return self;
	};


	/**
	 * Update node connections
	 */
	restart () {
		return this.stop().start();
	};


	/**
	 * Stop generating sound
	 *
	 * @return {Block} Return self
	 */
	stop () {
		var self = this;

		if (!self.isActive) return self;

		self.isActive = false;

		if (self.node && self.node.stop) {
			try {
				self.node.stop();
			} catch (e) {
				console.log(e.message)
			}
		}

		if (self.node) {
			self.node.disconnect();
		}

		self.emit('stop');

		return self;
	};


	/**
	 * Represent instance as JSON
	 */
	toJSON () {
		var self = this;

		var data = {
			id: self.id,

			//position
			top: offset(self.element).top,
			left: offset(self.element).left,

			//className to recreate
			className: self.className,

			//connections to other blocks
			outputs: []
		};

		//connections
		self.outputs.forEach(function (conn) {
			data.outputs.push(conn.to.id);
		});

		return data;
	};
}


var proto = Block.prototype;


/** Class name for storage */
proto.className = 'Block';


/**
 * Block states
 */
proto.state = {
	//loading node/source
	loading: {
		before: function () {
			var self = this;

			self.element.classList.add('block-loading');
		},

		after: function () {
			var self = this;

			self.element.classList.remove('block-loading');
		}
	},

	ready: {

	},

	//hangling connection
	connecting: {
		before: function () {
			var self = this;
			self.element.classList.add('block-connecting');

			//highlight potential targets
			q.all('[data-block-potential-target]', self.container).forEach(function (el) {
				el.classList.add('block-potential-target');
			});

			//unhighlight potential sources
			q.all('[data-block-potential-source]', self.container).forEach(function (el) {
				el.classList.remove('block-potential-source');
			});
		},
		after: function () {
			var self = this;
			self.element.classList.remove('block-connecting');

			//unhighlight potential targets
			q.all('[data-block-potential-target]', self.container).forEach(function (el) {
				el.classList.remove('block-potential-target');
			});

			//highlight potential sources
			q.all('[data-block-potential-source]', self.container).forEach(function (el) {
				el.classList.add('block-potential-source');
			});
		}
	},

	playing: {

	},

	//unable to load stream etc
	error: {
		before: function () {
			var self = this;
			self.element.classList.add('block-error');
		},

		after: function () {
			var self = this;
			self.element.classList.remove('block-error');
		}
	}
};


/** Audio context, probably redefined via options */
proto.context = require('audio-context');


/** Number of outputs/inputs */
proto.numberOfOutputs = 1;
proto.numberOfInputs = 1;


/** Templates are supposed to be defined in descedant classes */
proto.contentTpl = ``;
proto.thumbnailTpl = ``;


/** App rendering settings */
proto.appendable = true;
proto.deletable = true;


module.exports = Block;