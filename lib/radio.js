/**
 * Internet radio station block
 */

var Block = require('./block');
var Emitter = require('events');
var inherits = require('inherits');
var app = require('./application');
var q = require('queried');
var on = require('emmy/on');


/**
 * Create internet radio source based of url passed
 *
 * @constructor
 */
function Radio (url) {
	var self = this;

	Block.apply(self, arguments);

	self.audio = document.createElement('audio');
	self.audio.autoplay = true;
	self.audio.src = self.url;
	self.node = app.context.createMediaElementSource(self.audio);

	self.audio.play();

	//show code in textarea
	self.input = q('input', self.content);
	self.input.value = self.url;

	//update url
	on(self.input, 'change', function () {
		self.audio.src = self.input.value;
	});

	//go ready state
	self.state = 'ready';
}

inherits(Radio, Block);



var proto = Radio.prototype;


/** Default url to load */
proto.url = `assets/chopin.mp3`;


proto.numberOfInputs = 0;


/**
 * Show url input in content
 */
proto.contentTpl = `
<input id="radio-url" class="block-input" placeholder="Radio station URL" type="url" value=""/>
`;

proto.thumbnailTpl = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="20 0 80 100"><path d="M83.47 29.076c-.725-8.188-4.182-14.112-9.737-16.68-1.88-.87-3.928-1.312-6.088-1.312-9.176 0-19.277 7.808-26.167 19.86l-6.482-4.53 2.143-3.22c.917-1.38.542-3.24-.837-4.16-1.38-.917-3.242-.542-4.16.837l-2.066 3.107-1.25-.873 2.047-3.077c.918-1.38.543-3.242-.836-4.16-1.38-.918-3.242-.543-4.16.836l-1.97 2.963-2.797-1.955c-1.357-.946-3.228-.618-4.177.74-.95 1.36-.618 3.23.74 4.18l2.91 2.033-1.883 2.83c-.918 1.38-.543 3.242.836 4.16.51.34 1.088.502 1.66.502.97 0 1.922-.47 2.5-1.338L25.5 27.1l1.25.873-1.788 2.687c-.918 1.38-.543 3.242.836 4.16.51.34 1.088.502 1.66.502.97 0 1.922-.47 2.5-1.338l1.71-2.573 7.07 4.942c-7.97 17.865-5.79 35.626 5.11 40.665 1.88.87 3.928 1.31 6.088 1.31s4.372-.437 6.58-1.255v8.842c0 1.657 1.344 3 3 3h21.088c.993 0 1.92-.49 2.48-1.312s.675-1.863.31-2.787l-9.164-23.287c1.563-2.378 3-4.958 4.27-7.707 3.875-8.37 5.637-17.158 4.967-24.744zm-7.267 53.84H62.52v-9.012c2.597-1.786 5.12-4.068 7.473-6.77l6.21 15.78zm-3.144-31.61c-5.634 12.18-15.357 21.023-23.12 21.023-1.286 0-2.486-.256-3.57-.757-7.425-3.433-8.496-17.693-2.612-31.713l13.316 9.306c.523.365 1.123.54 1.716.54.946 0 1.878-.445 2.46-1.28.95-1.358.62-3.23-.74-4.178l-14.078-9.84c5.75-10.226 14.263-17.323 21.214-17.323 1.284 0 2.485.255 3.57.756 3.52 1.63 5.75 5.807 6.276 11.764.58 6.558-.994 14.265-4.433 21.7z"/></svg>
`;


module.exports = Radio;