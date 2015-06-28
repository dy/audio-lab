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
var inherits = require('inherits');


/**
 * Create analyser node based of options
 * TODO: merge it to each connection.
 *
 * @constructor
 */
function Analyser (options) {
	var self = this;

	Block.apply(self, arguments);

	//set generator function
	if (isFn(options)) {
		self.generate = options;
	}

	//create stats analyser
	self.stats = new Stats({
		fftSize: 1024//*32
	});

	self.content.appendChild(self.stats.element);
	self.node = self.stats.node;

	//go ready state
	self.state = 'ready';

	return self;
}

inherits(Analyser, Block);


var proto = Analyser.prototype;


/**
 * Layout
 */
proto.thumbnailTpl = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 2 100 100"><path d="M18 86.5c0 2.475-2.025 4.5-4.5 4.5h-9C2.025 91 0 88.975 0 86.5v-28C0 56.025 2.025 54 4.5 54h9c2.475 0 4.5 2.025 4.5 4.5v28zM45 86.5c0 2.475-2.025 4.5-4.5 4.5h-9c-2.475 0-4.5-2.025-4.5-4.5v-50c0-2.475 2.025-4.5 4.5-4.5h9c2.475 0 4.5 2.025 4.5 4.5v50zM73 86.5c0 2.475-2.025 4.5-4.5 4.5h-9c-2.475 0-4.5-2.025-4.5-4.5v-73c0-2.475 2.025-4.5 4.5-4.5h9c2.475 0 4.5 2.025 4.5 4.5v73zM100 86.5c0 2.475-2.025 4.5-4.5 4.5h-9c-2.475 0-4.5-2.025-4.5-4.5v-46c0-2.475 2.025-4.5 4.5-4.5h9c2.475 0 4.5 2.025 4.5 4.5v46z"/></svg>
`;


module.exports = Analyser;