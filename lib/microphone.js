/**
 * Microphone block
 */

var Block = require('./block');
var isFn = require('is-function');
var on = require('emmy/on');
var q = require('queried');
var inherits = require('inherits');
var getUserMedia = require('getusermedia');


/**
 * Create microphone based on usermedia
 *
 * @constructor
 */
function Microphone (options) {
	var self = this;

	Block.apply(self, arguments);

	//get access to the microphone
	getUserMedia({video: false, audio: true}, function (err, stream) {
		if (err) {
			console.log('failed to get microphone');
			self.state = 'error';
		} else {
			self.node = self.app.context.createMediaStreamSource(stream);
			self.restart();
			self.state = 'ready';
		}
	});

	return self;
}

inherits(Microphone, Block);


var proto = Microphone.prototype;


proto.numberOfInputs = 0;


/**
 * Layout
 */
proto.thumbnailTpl = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 85 115"><path d="M37.5 50C44.41 50 50 44.403 50 37.5v-25C50 5.597 44.41 0 37.5 0S25 5.597 25 12.5v25C25 44.403 30.59 50 37.5 50z" fill="#010101"/><path d="M50 87.5h-6.25V74.365C61.45 71.375 75 56.035 75 37.5v-6.055c0-3.455-2.795-6.25-6.25-6.25s-6.25 2.795-6.25 6.25V37.5c0 13.788-11.206 25-25 25s-25-11.212-25-25v-6.055c0-3.455-2.795-6.25-6.25-6.25S0 27.99 0 31.445V37.5c0 18.536 13.55 33.875 31.25 36.865V87.5H25c-6.91 0-12.5 5.59-12.5 12.5h50c0-6.91-5.59-12.5-12.5-12.5z" fill="#010101"/></svg>
`;


module.exports = Microphone;