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
		fftSize: 1024*32
	});

	self.content.appendChild(self.stats.element);
	self.node = self.stats.node;

	return self;
}

var proto = AnalyserBlock.prototype = Object.create(Block.prototype);


/**
 * Create generator layout
 */
proto.template = `
<div class="block block-analyser">
	<div class="block-thumbnail">
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M18 86.5c0 2.475-2.025 4.5-4.5 4.5h-9C2.025 91 0 88.975 0 86.5v-28C0 56.025 2.025 54 4.5 54h9c2.475 0 4.5 2.025 4.5 4.5v28zM45 86.5c0 2.475-2.025 4.5-4.5 4.5h-9c-2.475 0-4.5-2.025-4.5-4.5v-50c0-2.475 2.025-4.5 4.5-4.5h9c2.475 0 4.5 2.025 4.5 4.5v50zM73 86.5c0 2.475-2.025 4.5-4.5 4.5h-9c-2.475 0-4.5-2.025-4.5-4.5v-73c0-2.475 2.025-4.5 4.5-4.5h9c2.475 0 4.5 2.025 4.5 4.5v73zM100 86.5c0 2.475-2.025 4.5-4.5 4.5h-9c-2.475 0-4.5-2.025-4.5-4.5v-46c0-2.475 2.025-4.5 4.5-4.5h9c2.475 0 4.5 2.025 4.5 4.5v46z"/></svg>
	</div>
	<div class="block-content" hidden></div>
</div>
`;