/**
 * Piano block
 */

var Block = require('./block');
var isFn = require('is-function');
var on = require('emmy/on');
var q = require('queried');
var inherits = require('inherits');
var midi = require('web-midi');
var key = require('piano-key');
var keyboard = require('piano-keyboard');
var roll = require('piano-roll');


/**
 * Create midi block based of options
 *
 * @constructor
 */
function Piano () {
	var self = this;

	Block.apply(self, arguments);

	//go ready state
	self.state = 'ready';

	return self;
}

inherits(Piano, Block);



var proto = Piano.prototype;


/** Params of keyboard */
proto.


/** Params of roll */



/**
 * Layout
 */
proto.thumbnailTpl = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="20 23 60 60"><path d="M69.842 28.657H38.95 30.157c-.828 0-1.5.67-1.5 1.5v39.686c0 .828.672 1.5 1.5 1.5h39.686c.828 0 1.5-.672 1.5-1.5V30.157c0-.828-.672-1.5-1.5-1.5zM54.812 53.5h1.618v14.843H43.57V53.5h1.617c.83 0 1.5-.67 1.5-1.5V31.658h6.626V52c0 .828.672 1.5 1.5 1.5zM31.658 31.657h5.794V52c0 .83.672 1.5 1.5 1.5h1.62v14.843h-8.913V31.657zm36.685 36.686h-8.91V53.5h1.616c.828 0 1.5-.672 1.5-1.5V31.657h5.794v36.686z"/></svg>
`;

proto.contentTpl = `
<div class="piano-roll"></div>
<div class="piano-keyboard"></div>
`


module.exports = Piano;