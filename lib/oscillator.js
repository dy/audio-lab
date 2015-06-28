/**
 * Oscillator block.
 */

var Block = require('./block');
var app = require('./application');
var isFn = require('is-function');
var on = require('emmy/on');
var q = require('queried');
var inherits = require('inherits');
var isString = require('mutype/is-string');
var ctx = app.context;



/**
 * Create generator based of function
 *
 * @constructor
 */
function Oscillator (options) {
	var self = this;

	Block.apply(self, arguments);

	//go ready state
	self.state = 'ready';

	return self;
}

inherits(Oscillator, Block);

var proto = Oscillator.prototype;


proto.numberOfInputs = 0;


proto.createOscillator = function () {
	var self = this;

	self.node = app.context.createOscillator();
	self.node.type = 'square';
	self.node.frequency.value = 440;

	return self;
};

/**
 * Oscillator has to be recreated each start
 * as it is not available to start it twice
 */
proto.start = function () {
	var self = this;
	self.createOscillator();

	return Block.prototype.start.call(self);
};



/**
 * Oscillator layout
 */
proto.contentTpl = `
<input class="oscillator-frequency" type="number" value="440"/>
<input class="oscillator-value" type="number" value="440"/>
<input class="oscillator-detune" type="number" value="440"/>
<input class="oscillator-type" type="number" value="440"/>
`;

proto.thumbnailTpl = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="247.6 741.9 100 125"><path d="M320.3 801.9c-7.1 0-10.7-4.5-13.7-8.1-3-3.7-5-5.9-9-5.9s-6.1 2.2-9 5.9c-2.9 3.6-6.6 8.1-13.7 8.1s-10.7-4.5-13.7-8.1c-3-3.7-5-5.9-9-5.9v-6c7.1 0 10.7 4.5 13.7 8.1 3 3.7 5 5.9 9 5.9s6.1-2.2 9-5.9c2.9-3.6 6.6-8.1 13.7-8.1s10.7 4.5 13.7 8.1c3 3.7 5 5.9 9 5.9s6.1-2.2 9-5.9c2.9-3.6 6.6-8.1 13.7-8.1v6c-4 0-6.1 2.2-9 5.9-2.9 3.6-6.6 8.1-13.7 8.1z"/></svg>
`;



/**
 * Represent instance as JSON
 */
proto.toJSON = function () {
	var self = this;

	var data = Block.prototype.toJSON.apply(self);


	return data;
};


/**
 * Load from JSON
 */
proto.fromJSON = function (data) {
	var self = this;

	Block.prototype.fromJSON.call(self, data);


	return self;
};



module.exports = Oscillator;