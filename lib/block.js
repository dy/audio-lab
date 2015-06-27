/**
 * Generic audio block.
 * Provides inputs/outputs and connection interface.
 */


var Emitter = require('events');
var app = require('./application');
var extend = require('xtend/mutable');
var domify = require('domify');
var hasDom = require('has-dom');
var Draggable = require('draggy');
var Dialog = require('dialog-component');
var Connection = require('./connection');


module.exports = Block;


/**
 * Create an empty block
 *
 * @constructor
 */
function Block (options) {
	var self = this;

	if (!(self instanceof Block)) {
		return new Block(options);
	}

	if (options && typeof options === 'object') {
		extend(this, options);
	}

	//keep destination connections set
	self.destinations = new WeakSet();

	//bind global events
	app.on('start', function () {
		self.start();
	});

	app.on('stop', function () {
		self.stop();
	});

	//create DOM representation
	self.createElement();
	self.show();
}


var proto = Block.prototype = Object.create(Emitter.prototype);


/** An element */
proto.template = '<div class="block"></div>';


/**
 * Construct DOM representation
 */
proto.createElement = function () {
	var self = this;

	if (!hasDom) return;

	self.element = domify(self.template);

	self.draggable = new Draggable(self.element, {
		within: app.container,
		handle: '.block-thumbnail',
		threshold: 10,
		css3: false
	});

	//show dialog on click
	self.content = q('.block-content', self.element);

	if (!self.content) throw Error('Block has no content element');

	self.element.removeChild(self.content);
	self.content.removeAttribute('hidden');
	self.dialog = new Dialog(self.content);
	self.dialog.escapable().closable().effect('fade');
	on(self.element, 'dblclick', function (e) {
		self.dialog.show();
	});

	//correct cords on drag
	self.draggable.on('drag', function () {
		self.update();
	});

	return self;
};


/**
 * Reveal in DOM
 */
proto.show = function () {
	var self = this;

	if (!hasDom) return self;

	self.isVisible = true;

	app.container.appendChild(self.element);

	self.emit('show');
	return self;
};



/**
 * Remove from DOM, go underground
 */
proto.hide = function () {
	var self = this;

	if (!hasDom) return self;

	self.isVisible = false;

	app.container.removeChild(self.element);

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

	//create connection
	self.destinations.add(new Connection(self, block));

	self.emit('connect');
	return self;
};


/**
 * Disconnect node from other block
 *
 * @return {Block} Return self
 */
proto.disconnect = function (from) {
	var self = this;

	if (from) {
		self.destinations.delete(from);
	}

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

	if (self.node && self.destination) {
		self.node.connect(self.destination);
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
 * Save position & params to storage
 */
proto.save = function () {

};


/**
 * Load position & params from storage
 */
proto.load = function () {

};