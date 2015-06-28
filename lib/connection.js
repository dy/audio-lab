/**
 * Cord between two blocks
 */

var Emitter = require('events');
var hasDom = require('has-dom');
var css = require('mucss/css');
var offset = require('mucss/offset');
var app = require('./application');
var on = require('emmy/on');
var win = require('global/window');
var domify = require('domify');
var inherits = require('inherits');


/**
 * Constructor
 *
 * @constructor
 */
function Connection () {
	var self = this;

	//generate unique connection id
	self.id = app.getId();

	//save item by id
	app.items[self.id] = self;

	//create DOM representation
	self.createElement();
}

inherits(Connection, Emitter);

var proto = Connection.prototype;


/**
 * Create DOM-representation
 */
proto.createElement = function () {
	var self = this;

	if (!hasDom) return self;

	self.element = domify(`
		<div class="connection"></div>
	`);
	app.container.appendChild(self.element);

	on(win, 'resize', function () {
		self.update();
	});

	return self;
};


/**
 * Type of connection:
 * Control
 * Audio
 */
proto.type = 'audio';


/**
 * Number of channels
 */
proto.channels = 2;


/**
 * Connect two blocks
 *
 * @param {Block} block from a
 * @param {Block} block to b
 *
 * @return {Connection} Self
 */
proto.connect = function (a, b) {
	var self = this;

	self.from = a;
	self.to = b;
	self.isActive = true;

	//bind output node
	self.outEl = q('.block-out', self.from.element);
	self.inEl = q('.block-in', self.to.element);

	self.from.on('update', function () {
		self.update();
	});
	self.to.on('update', function () {
		self.update();
	});


	self.update();

	return self;
};


/**
 * Remove connection
 */
proto.destroy = function () {
	var self = this;
	// self.from.off('update');
	// self.to.off('update');

	self.from = null;
	self.to = null;
	self.inEl = null;
	self.outEl = null;

	app.container.removeChild(self.element);
};


/**
 * Update connection position
 */
proto.update = function (fromCoord, toCoord) {
	var self = this;

	//update rotation to match source/destination nodes
	if (!fromCoord) fromCoord = offset(self.from.element);
	if (!toCoord) toCoord = offset(self.to.element);

	//find distance
	var dx = (toCoord.left - fromCoord.left);
	var dy = (toCoord.top - fromCoord.top);

	var w = Math.sqrt(dx*dx + dy*dy);

	//set width
	css(self.element, 'width', w);

	//set coords
	var h = self.element.clientHeight;
	css(self.element, {
		'top': fromCoord.top + fromCoord.height/2 - h/2,
		'left': fromCoord.left + fromCoord.width/2
	});

	//find angle
	var angle = Math.atan2(dy, dx);

	css(self.element, 'transform', `rotate(${ angle }rad)`);

	//rotate input/output
	css(self.outEl, 'transform', `rotate(${ angle }rad)`);
	css(self.inEl, 'transform', `rotate(${ angle + Math.PI }rad)`);

	return self;
};



/**
 * Save position & params to storage
 */
proto.toJSON = function () {
	var self = this;

	if (!self.from || !self.to) return;

	var data = {
		from: self.from.id,
		to: self.to.id,

		class: self.constructor.name
	};

	return data;
};


/**
 * Load position & params from storage
 */
proto.fromJSON = function (data) {
	var self = this;

	self.connect(app.items[data.from], app.items[data.to]);

	return self;
};



module.exports = Connection;