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
var ctx = app.context;


module.exports = GeneratorBlock;


/**
 * @constructor
 */
function GeneratorBlock (options) {
	var self = this;

	Block.apply(this, arguments);

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
		self.generate = new Function ('t', src);

		if (self.isActive) {
			self.stop();
			self.start();
		}
	});


	self.on('start', function () {
		//generate initial chunk
		self.createSource(app.time);
		if (self.node) {
			self.node.start();
		}
	});

	self.on('stop', function () {
		if (self.node) {
			self.node.stop();
		}
	});

	//connect source node on external connect call
	self.on('connect', function () {
		if (self.node) {
			self.node.connect(self.destination);
		}
	});

	return self;
}

var proto = GeneratorBlock.prototype = Object.create(Block.prototype);


/**
 * Create generator layout
 */
proto.template =
'<div class="block block-generator">' +
'function (t) {' +
'<textarea class="block-generator-code" rows="10"></textarea>' +
'}';
'</div>';


/**
 * Generate -1..1 noise by default
 */
proto.generate = function (t) {
	return Math.random() * 2 - 1;
};


/** Default is stereo */
proto.channels = app.channels;


/**
 * Create a new buffer from the time offset
 */
proto.createSource = function () {
	var self = this;

	var frameCount = (app.duration - app.time) * ctx.sampleRate / 1000;

	var buffer = ctx.createBuffer(self.channels, frameCount, ctx.sampleRate);

	// Fill the buffer with white noise;
	//just random values between -1.0 and 1.0
	for (var channel = 0; channel < self.channels; channel++) {
		var nowBuffering = buffer.getChannelData(channel);

		for (var i = 0; i < frameCount; i++) {
			nowBuffering[i] = self.generate(i / ctx.sampleRate);
		}
	}

	// Get an AudioBufferSourceNode.
	// This is the AudioNode to use when we want to play an AudioBuffer
	var source = ctx.createBufferSource();

	// set the buffer in the AudioBufferSourceNode
	source.buffer = buffer;

	//save node
	self.node = source;

	//recreate source on playing has finished
	self.node.onended = function () {
		// console.log('generator ended');
		// self.createSource();
		self.node.disconnect();
	};

	//connect the AudioBufferSourceNode to the
	//destination so we can hear the sound
	if (self.destination) {
		self.node.connect(self.destination);
	}

	return self;
};