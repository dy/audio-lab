/**
 * Generator block processor.
 * Takes a function to generate buffer.
 */

var Block = require('./block');
var app = require('./application');
var isFn = require('is-function');
var on = require('emmy/on');
var off = require('emmy/off');
var q = require('queried');
var autosize = require('autosize');
var baudio = require('webaudio');
var inherits = require('inherits');
var isString = require('mutype/is-string');



/**
 * Create generator based of function
 *
 * @constructor
 */
function Generator () {
	var self = this;

	Block.apply(self, arguments);

	//show code in textarea
	self.textarea = q('[data-generator-code]', self.content);
	self.textarea.value = self.toJSON().generate;
	autosize(self.textarea);

	on(self.textarea, 'change', function () {
		var src = self.textarea.value;
		self.setGenerator(src);
	});

	//attach generator
	self.setGenerator(self.generate);

	//go ready state
	self.state = 'ready';

	return self;
}

inherits(Generator, Block);



var proto = Generator.prototype;


proto.numberOfInputs = 0;


/**
 * Generator layout
 */
proto.contentTpl = `
function (t, i, sample) {
<textarea class="block-code" rows="10" data-generator-code></textarea>
}
`;

proto.thumbnailTpl = `
<style>
.block-generator-thumbnail {
	font-family: serif;
	font-style: italic;
	font-size: 2.4rem;
	font-weight: bolder;
}
</style>
<span class="block-generator-thumbnail">f</span>
`;


/**
 * Generate -1..1 noise by default
 */
proto.generate = function (t, i, sample) {
	return Math.cos(2 * Math.PI * 220 * t);
};


/**
 * Resetup generator from string or function
 */
proto.setGenerator = function (fn) {
	var self = this;

	if (isString(fn)) {
		//allow strange syntax
		fn = fn.replace(/\n/, ' ');
		fn = new Function ('t', 'i', 'sample', fn);
	}

	var isActive = self.isActive;

	isActive && self.stop();

	self.generate = fn;

	self.textarea.value = self.toJSON().generate;

	//create generator node
	self.node = baudio(self.app.context, self.generate);

	isActive && self.start();

	return self;
};


/**
 * Destroy additional things
 */
proto.destroy = function () {
	var self = this;

	autosize.destroy(self.textarea);
	self.autosize = null;

	off(self.textarea);
	self.textarea = null;

	return Block.prototype.destroy.apply(self);
};



/**
 * Represent instance as JSON
 */
proto.toJSON = function () {
	var self = this;

	var data = Block.prototype.toJSON.apply(self);

	//save generator function
	var fnStr = self.generate.toString();
	fnStr = fnStr.slice(fnStr.indexOf("{") + 1, fnStr.lastIndexOf("}")).trim();

	data.generate = fnStr;

	return data;
};


/**
 * Load from JSON
 */
proto.fromJSON = function (data) {
	var self = this;

	Block.prototype.fromJSON.call(self, data);

	if (data.generate) {
		self.setGenerator(data.generate);
	}

	return self;
};



module.exports = Generator;