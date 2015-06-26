/**
 * Analyser block
 */

var Block = require('./block');
var app = require('./application');
var isFn = require('is-function');
var on = require('emmy/on');
var q = require('queried');
var autosize = require('autosize');
var Stats = require('audio-stats');
var ctx = app.context;


module.exports = AnalyserBlock;


/**
 * @constructor
 */
function AnalyserBlock (options) {
	var self = this;

	Block.apply(self, arguments);

	//set generator function
	if (isFn(options)) {
		self.generate = options;
	}

	//create stats analyser
	self.stats = new Stats({
		element: self.element,
		fftSize: 1024*32
	});

	self.node = self.stats.node;

	return self;
}

var proto = AnalyserBlock.prototype = Object.create(Block.prototype);


/**
 * Create generator layout
 */
proto.template =
'<div class="block block-analyser">' +
'</div>';