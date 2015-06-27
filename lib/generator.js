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
var ctx = app.context;


module.exports = GeneratorBlock;


/**
 * @constructor
 */
function GeneratorBlock (options) {
	var self = this;

	Block.apply(self, arguments);

	//set generator function
	if (isFn(options)) {
		self.generate = options;
	}

	//show code in textarea
	self.textarea = q('.block-generator-code', self.element);
	self.textarea.value = self.generate.toString().slice(14,-2).trim();
	autosize(self.textarea);

	on(self.textarea, 'change', function () {
		var src = self.textarea.value;

		//allow strange syntax
		src = src.replace(/\n/, ' ');

		self.setGenerator(new Function ('t', src));
	});

	//attach generator
	self.setGenerator(self.generate);

	return self;
}

var proto = GeneratorBlock.prototype = Object.create(Block.prototype);


/**
 * Create generator layout
 */
proto.template =
'<div class="block block-generator">' +
'function (t, i, sample) {' +
'<textarea class="block-generator-code" rows="10"></textarea>' +
'}' +
'</div>';


/**
 * Generate -1..1 noise by default
 */
proto.generate = function (t) {
	return Math.random() * 2 - 1;
};


/**
 * Resetup generator function
 */
proto.setGenerator = function (fn) {
	var self = this;

	self.stop();

	self.generate = fn;

	//create generator node
	self.node = baudio(ctx, self.generate);

	self.start();

	return self;
};