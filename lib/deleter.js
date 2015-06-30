/**
 * Current item deleter
 */

var Emitter = require('events');
var inherits = require('inherits');
var domify = require('domify');
var on = require('emmy/on');
var hasDom = require('has-dom');
var capfirst = require('mustring/capfirst');
var delegate = require('emmy/delegate');


/**
 * Create items deleter for the app
 * @constructor
 */
function Deleter (app) {
	var self = this;

	self.app = app;

	self.element = domify(`
	<div class="deleter" data-delete-area></div>
	`);

	app.container.appendChild(self.element);
}


inherits(Deleter, Emitter);


var proto = Deleter.prototype;


/**
 * Show deleter
 */
proto.show = function () {
	var self = this;
	return self;
};


/**
 * Hide deleter
 */
proto.hide = function () {
	var self = this;
	return self;
};


module.exports = Deleter;