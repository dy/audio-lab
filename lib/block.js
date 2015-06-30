/**
 * Generic audio block.
 * Provides inputs/outputs and connection interface.
 */


var Emitter = require('events');
var domify = require('domify');
var hasDom = require('has-dom');
var Draggable = require('draggy');
var Dialog = require('dialog-component');
var Connection = require('./connection');
var JSON = require('json3');
var offset = require('mucss/offset');
var delegate = require('emmy/delegate');
var on = require('emmy/on');
var off = require('emmy/off');
var once = require('emmy/once');
var css = require('mucss/css');
var inherits = require('inherits');
var win = require('global/window');
var selection = require('mucss/selection');
var q = require('queried');
var defineState = require('define-state');


/**
 * Create an empty block
 *
 * @constructor
 */
function Block (app) {
	var self = this;

	if (!app) {
		throw Error('Application instance should be passed');
	}

	self.app = app;

	//create unique id
	self.id = self.app.getId();

	//save instance by id
	self.app.items[self.id] = self;

	//create DOM representation
	self.createElement();

	//keep outputs set
	self.outputs = new Set();
	self.inputs = new Set();

	//save instance on element
	self.element.block = self;

	//reflect state
	defineState(self, 'state', self.state);
	self.state = 'loading';

	//bind global events
	on(self.app, 'start.' + self.id, function () {
		self.start();
	});

	on(self.app, 'stop.' + self.id, function () {
		self.stop();
	});

	//rerender
	self.update();
}


inherits(Block, Emitter);


var proto = Block.prototype;


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

	connecting: {
		before: function () {
			var self = this;
			self.element.classList.add('block-connecting');
		},
		after: function () {
			var self = this;
			self.element.classList.remove('block-connecting');
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


/**
 * Construct DOM representation
 */
proto.createElement = function () {
	var self = this;

	if (!hasDom) return;

	self.element = domify(`
		<div class="block block-${ self.constructor.name.toLowerCase() }" data-block
			tabindex="1"
			title="${ self.constructor.name.toLowerCase() }">
			<div class="block-thumbnail" data-block-thumbnail data-block-handle>${ self.thumbnailTpl }</div>
			<div class="block-content" data-block-content hidden>${ self.contentTpl }</div>
			<div class="block-out" data-block-output hidden></div>
			<div class="block-in" data-block-input hidden></div>
		</div>
	`);

	self.app.element.appendChild(self.element);

	self.draggable = new Draggable(self.element, {
		within: self.app.element,
		threshold: 10,
		css3: false,
		handle: [`[data-from="${ self.id }"]`, `[data-to="${ self.id }"]`, q(`[data-block-handle]`, self.element)],
		droppable: [`[data-delete-area]`],
		droppableClass: `droppable-active`
	});

	//move so to avoid overlapping
	self.draggable.move(
		Math.random() * 300,
		Math.random() * 300
	);

	//show dialog on click
	self.content = q('[data-block-content]', self.element);

	if (!self.content) throw Error('Block has no content element');

	self.element.removeChild(self.content);
	self.content.removeAttribute('hidden');
	self.dialog = new Dialog(self.content);
	self.dialog.escapable().closable().effect('fade');

	on(self.element, 'dblclick', function (e) {
		self.show();
	});

	self.thumbnail = q('[data-block-thumbnail]', self.element);

	//correct cords on drag
	on(self.draggable, 'drag.' + self.id, function () {
		self.update();
	});

	//display app dragging state
	on(self.draggable, 'dragstart.' + self.id, function () {
		self.app.state = 'dragging';
	});
	on(self.draggable, 'dragend.' + self.id, function () {
		self.app.state = 'ready';
	});
	on(self.draggable, 'drop.' + self.id, function (target) {
		if (target === self.app.deleter) {
			self.destroy();
		}
	});

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


/** Number of outputs/inputs */
proto.numberOfOutputs = 1;
proto.numberOfInputs = 1;


/** Templates are supposed to be defined in descedant classes */
proto.contentTpl = ``;
proto.thumbnailTpl = ``;


/** App rendering settings */
proto.appendable = true;
proto.deletable = true;


/**
 * Destruct self, safely
 */
proto.destroy = function () {
	var self = this;

	if (!self.deletable) return self;

	self.app.element.removeChild(self.element);
	delete self.app.items[self.id];

	//delete connections
	self.outputs.forEach(function (conn) {
		conn.destroy();
	});
	self.inputs.forEach(function (conn) {
		conn.destroy();
	});

	off(self.element, '.' + self.id);
	off(self.draggable, '.' + self.id);
	off(self.app, '.' + self.id);

	//clear reference
	self.element.block = null;
	self.element = null;

	self.draggable.destroy();
	self.draggable = null;
};


/**
 * Reveal in DOM settings dialog
 */
proto.show = function () {
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
proto.hide = function () {
	var self = this;

	if (!hasDom) return self;

	self.dialog.hide();

	self.emit('hide');
	return self;
};


/**
 * Draw node step in raf
 *
 * @return {Block} Return self
 */
proto.draw = function () {
	var self = this;

	self.emit('draw');
	return self;
};

/**
 * Update node size, position and connections
 *
 * @return {Block} Return self
 */
proto.update = function () {
	var self = this;

	//check need to hide input/output
	if (self.numberOfInputs > self.inputs.size) {
		q('[data-block-input]', self.element).removeAttribute('hidden');
	} else {
		q('[data-block-input]', self.element).setAttribute('hidden', true);
	}
	if (self.numberOfOutputs > self.outputs.size) {
		q('[data-block-output]', self.element).removeAttribute('hidden');
	} else {
		q('[data-block-output]', self.element).setAttribute('hidden', true);
	}

	self.emit('update');
	return self;
};



/**
 * Connect block to another block
 *
 * @return {Block} Return self
 */
proto.connect = function (block) {
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
proto.disconnect = function (target) {
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
proto.start = function () {
	var self = this;

	if (self.isActive) return self;

	self.isActive = true;

	if (self.node) {
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
proto.restart = function () {
	return this.stop().start();
};


/**
 * Stop generating sound
 *
 * @return {Block} Return self
 */
proto.stop = function () {
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
proto.toJSON = function () {
	var self = this;

	var data = {
		//position
		top: offset(self.element).top,
		left: offset(self.element).left,

		class: self.constructor.name
	};

	return data;
};


/**
 * Load params from JSON passed
 */
proto.fromJSON = function (data) {
	var self = this;

	//set position
	css(self.element, {
		top: data.top,
		left: data.left
	});

	return self;
};


module.exports = Block;