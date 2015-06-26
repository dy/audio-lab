/**
 * App singleton
 * @module  audio-lab/app
 */

var Emitter = require('events');
var ctx = require('audio-context');
var extend = require('xtend/mutable');
var hasDom = require('has-dom');


/** Export singleton */
var App = Object.create(Emitter.prototype);


/** Provide static classes */
extend(App, {
	context: ctx
});

/** Container to place elements */
App.container = hasDom ? document.body : null;

/** Default is stereo */
App.channels = 2;


/** Time offset */
App.time = 0;


/** Duration of sound, in ms */
App.duration = 10 * 1000;


/** Whether is playing */
App.isActive = false;


/** Start everyone */
App.start = function () {
	if (this.isActive) return this;

	this.isActive = true;

	this.emit('start');
	return this;
};


/** Start everyone */
App.stop = function () {
	if (!this.isActive) return this;

	this.isActive = false;

	this.emit('stop');
	return this;
};


module.exports = App;