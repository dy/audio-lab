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

	//bind global events
	app.on('start', function () {
		self.start();
	});

	app.on('stop', function () {
		self.stop();
	});

	if (hasDom) {
		self.element = domify(self.template);
		self.show();

		// self.draggable = new Draggable(self.element, {
		// 	within: app.container,
		// 	handle: self.element
		// });
	}
}


var proto = Block.prototype = Object.create(Emitter.prototype);


/** An element */
proto.template = '<div class="block"></div>';


/**
 * Create DOM-representation
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

	self.destination = block;

	self.emit('connect');
	return self;
};


/**
 * Disconnect node from other block
 *
 * @return {Block} Return self
 */
proto.disconnect = function () {
	var self = this;

	self.destination = null;

	self.emit('disconnect');
	return self;
};


/**
 * Default processing callback
 *
 * @return {Block} Return self
 */
proto.process = function () {
	var self = this;

	self.emit('process');
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
	self.emit('stop');

	return self;
};