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

module.exports = Connection;


/**
 * Constructor
 *
 * @constructor
 */
function Connection (a,b) {
	var self = this;

	if (!(self instanceof Connection)) {
		return new Connection(a,b);
	}

	//create DOM representation
	self.createElement();

	self.connect(a,b);
}


var proto = Connection.prototype = Object.create(Emitter.prototype);


/**
 * Create DOM-representation
 */
proto.createElement = function () {
	var self = this;

	if (!hasDom) return self;

	self.element = domify(self.template);
	app.container.appendChild(self.element);

	on(win, 'resize', function () {
		self.update();
	});

	self.update();

	return self;
};


/**
 * Self template
 */
proto.template = `
<div class="connection">
</div>
`;


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
proto.disconnect = function () {
	self.from = null;
	self.to = null;

	app.container.removeChild(self.element);
};


/**
 * Update connection position
 */
proto.update = function () {
	var self = this;

	if (!self.isActive) return;

	//update rotation to match source/destination nodes
	var fromEl = self.from.element;
	var toEl = self.to.element;
	var fromCoord = offset(fromEl);
	var toCoord = offset(toEl);

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

	css(self.element, 'transform', 'rotate(' + angle + 'rad)');

	return self;
};