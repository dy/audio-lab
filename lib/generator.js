/**
 * Generator block processor.
 * Takes a function to generate buffer.
 */

var Block = require('./block');
var app = require('./application');
var isFn = require('is-function');
var on = require('emmy/on');
var q = require('queried');
var autosize = require('autosize');
var baudio = require('webaudio');
var inherits = require('inherits');
var isString = require('mutype/is-string');
var ctx = app.context;



/**
 * Create generator based of function
 *
 * @constructor
 */
function Generator (options) {
	var self = this;

	Block.apply(self, arguments);

	//set generator function
	if (isFn(options)) {
		self.generate = options;
	}

	//show code in textarea
	self.textarea = q('.block-code', self.content);
	self.textarea.value = self.toJSON().generate;
	autosize(self.textarea);

	on(self.textarea, 'change', function () {
		var src = self.textarea.value;
		self.setGenerator(src);
	});

	//attach generator
	self.setGenerator(self.generate);

	return self;
}

inherits(Generator, Block);

var proto = Generator.prototype;


proto.inputNumber = 0;


/**
 * Generator layout
 */
proto.contentTpl = `
function (t, i, sample) {
<textarea class="block-code" rows="10"></textarea>
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
proto.generate = function (t) {
	return Math.random() * 2 - 1;
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

	//create generator node
	self.node = baudio(ctx, self.generate);

	isActive && self.start();

	return self;
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