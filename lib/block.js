/**
 * Generic audio block.
 * Provides inputs/outputs and connection interface.
 */


var Emitter = require('events');
var app = require('./application');
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
var extend = require('xtend/mutable');
var win = require('global/window');
var selection = require('mucss/selection');



/**
 * Create an empty block
 *
 * @constructor
 */
function Block (options) {
	var self = this;

	if (options && typeof options === 'object') {
		extend(this, options);
	}

	//create DOM representation
	self.createElement();

	//keep outputs set
	self.outputs = new Set();
	self.inputs = new Set();

	//create unique id
	self.id = app.getId();

	//save instance by id
	app.items[self.id] = self;

	//save instance on element
	self.element.block = self;

	//bind global events
	app.on('start', function () {
		self.start();
	});

	app.on('stop', function () {
		self.stop();
	});
}


inherits(Block, Emitter);


var proto = Block.prototype;


/**
 * Construct DOM representation
 */
proto.createElement = function () {
	var self = this;

	if (!hasDom) return;

	self.element = domify(`
		<div class="block block-${ self.constructor.name.toLowerCase() }"
			tabindex="1"
			title="${ self.constructor.name.toLowerCase() }">
			<div class="block-thumbnail">${ self.thumbnailTpl }</div>
			<div class="block-content" hidden>${ self.contentTpl }</div>
		</div>
	`);

	//for each out/in create element
	for (var i = 0; i < self.outputNumber; i++) {
		var el = domify(`<div class="block-out"></div>`);
		self.element.appendChild(el);
	}
	for (var i = 0; i < self.inputNumber; i++) {
		var el = domify(`<div class="block-in"></div>`);
		self.element.appendChild(el);
	}

	app.container.appendChild(self.element);

	self.draggable = new Draggable(self.element, {
		within: app.container,
		handle: '.block-thumbnail',
		threshold: 10,
		css3: false
	});

	//move so to avoid overlapping
	self.draggable.move(
		Math.random() * 300,
		Math.random() * 300
	);

	//show dialog on click
	self.content = q('.block-content', self.element);

	if (!self.content) throw Error('Block has no content element');

	self.element.removeChild(self.content);
	self.content.removeAttribute('hidden');
	self.dialog = new Dialog(self.content);
	self.dialog.escapable().closable().effect('fade');

	//FIXME: make this click emulation better
	var intentClick = false;
	on(self.element, 'mousedown', function (e) {
		intentClick = true;
	});
	on(self.element, 'mouseup', function (e) {
		if (!intentClick) return;

		intentClick = false;
		if (self.element.classList.contains('draggy-drag')) return;

		self.show();
	});


	//correct cords on drag
	self.draggable.on('drag', function () {
		self.update();
	});

	//focus on click
	on(self.element, 'mousedown', function () {
		self.element.focus();
	});

	//handle keypresses
	on(self.element, 'keydown', function (e) {
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
	delegate(self.element, 'mousedown', '.block-out', function (e) {
		var target = e.delegateTarget;

		//take connection according to the element
		var tmpConnection = new Connection();

		selection.disable(app.container);

		//FIXME: maybe introduce global app states
		app.container.classList.add('connecting');

		//display connection
		on(document, 'mousemove', updateConnection);

		self.element.classList.add('block-connect-source');

		var lastDroppable;

		function updateConnection (e) {
			var coord = offset(self.element);
			tmpConnection.update(
				coord,
				{
					left: e.pageX - coord.width / 2,
					top: e.pageY - coord.height / 2,
					width: 0,
					height: 0
				},
				target
			);

			var closestBlockEl = e.target.closest('.block');

			//display connectability
			if (lastDroppable && lastDroppable != closestBlockEl) {
				lastDroppable.classList.remove('block-connect-target');
				lastDroppable = null;
			}

			//ignore bad closest block element
			if (!closestBlockEl || closestBlockEl === self.element) return;

			//check if target has available input slots
			var closestBlock = closestBlockEl.block;
			if (closestBlock.inputs.size >= closestBlock.inputNumber) return;

			if (closestBlockEl !== lastDroppable) {
				closestBlockEl.classList.add('block-connect-target');
				lastDroppable = closestBlockEl;
			}

			tmpConnection.update(
				coord,
				{
					left: e.pageX - coord.width / 2,
					top: e.pageY - coord.height / 2,
					width: 0,
					height: 0
				},
				target,
				q('.block-in:not(.connection-end)', lastDroppable)
			);
		}

		//end on finishing move
		once(document, 'mouseup', function (e) {
			off(document, 'mousemove', updateConnection);

			selection.enable(app.container);
			app.container.classList.remove('connecting');

			self.element.classList.remove('block-connect-source');

			//detect if dropped on good items - create connection
			tmpConnection.destroy();

			//clear occasinal hover
			if (lastDroppable) {
				lastDroppable.classList.remove('block-connect-target');

				var targetBlock = lastDroppable.block;
				lastDroppable = null;

				self.connect(targetBlock);
			}
		});
	});

	return self;
};


/** Number of outputs/inputs */
proto.outputNumber = 1;
proto.inputNumber = 1;


/** Templates are supposed to be defined in descedant classes */
proto.contentTpl = ``;
proto.thumbnailTpl = ``;


/**
 * Destruct self, safely
 */
proto.destroy = function () {
	var self = this;

	self.element.parentNode.removeChild(self.element);
	delete app.items[self.id];

	self.element.block = null;
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
 * Update node size and position
 *
 * @return {Block} Return self
 */
proto.update = function () {
	var self = this;

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
	if (self.outputs.size >= self.outputNumber) return self;
	if (block.inputs.size >= block.inputNumber) return self;

	//create connection
	var connection = new Connection();
	self.outputs.add(connection);
	block.inputs.add(connection);
	connection.connect(self, block);

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

	self.isActive = true;

	if (self.node) {
		self.outputs.forEach(function (connection) {
			//connect each node
			connection.from.node.connect(connection.to.node);
		});
	}

	if (self.node && self.node.start) {
		self.node.start();
	}

	self.emit('start');

	return self;
};


/**
 * Stop generating sound
 *
 * @return {Block} Return self
 */
proto.stop = function () {
	var self = this;

	self.isActive = false;

	if (self.node && self.node.stop) {
		self.node.stop();
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