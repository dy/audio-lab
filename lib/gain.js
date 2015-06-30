/**
 * Simple volume block
 * Temporary fast solution
 */

var Block = require('./block');
var isFn = require('is-function');
var on = require('emmy/on');
var q = require('queried');
var inherits = require('inherits');
var isString = require('mutype/is-string');



/**
 * Create generator based of function
 *
 * @constructor
 */
function Gain (options) {
	var self = this;

	Block.apply(self, arguments);

	self.input = q('.gain-value', self.content);

	on(self.input, 'input', function () {
		self.node.gain.value = self.input.value;
	});

	self.node = self.app.context.createGain();
	self.node.gain.value = self.input.value;

	//go ready state
	self.state = 'ready';

	return self;
}

inherits(Gain, Block);

var proto = Gain.prototype;



/**
 * Gain layout
 */
proto.contentTpl = `
<input class="gain-value" type="range" value="1" step="0.01" min="0" max="1" orientation="vertical"/>
<button class="gain-mute">x</button>
`;

proto.thumbnailTpl = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 125"><path fill="none" stroke="#000" stroke-width="4.963" stroke-miterlimit="10" d="M91.75 69.492H17.583L91.75 39.508z"/><path d="M65.75 50.683l-45 18.192h45"/></svg>
`;



/**
 * Represent instance as JSON
 */
proto.toJSON = function () {
	var self = this;

	var data = Block.prototype.toJSON.apply(self);

	data.value = self.input.value;

	return data;
};


/**
 * Load from JSON
 */
proto.fromJSON = function (data) {
	var self = this;

	Block.prototype.fromJSON.call(self, data);
	self.input.value = data.value;
	self.node.gain.value = parseFloat(data.value);

	return self;
};



module.exports = Gain;