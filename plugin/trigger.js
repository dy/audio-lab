/**
 * Simple button block
 * Generates 1 when pressed
 * Generates 0 when released
 */

var Lab = require('../');
var q = require('queried');
var on = require('emmy/on');
var baudio = require('webaudio');


/**
 * @constructor
 */
class Trigger extends Lab.Block {
	constructor (options) {
		super(options);

		var self = this;

		self.isOn = false;

		//create script generator
		self.node = baudio(self.context, function () {
			return self.isOn ? 1 : 0;
		});

		//create button
		self.button = q('[data-block-button]', self.element);

		//emit 1 when clicked, otherwise 0
		on(self.button, 'mousedown keydown', function () {
			self.isOn = true;
		});
		on(self.button, 'mouseup keyup', function () {
			self.isOn = false;
		});

		//go ready state
		self.state = 'ready';

		return self;
	}
}


var proto = Trigger.prototype;


proto.className = 'Trigger';


proto.numberOfInputs = 0;
proto.numberOfOutputs = 1;


/** Default title */
proto.title = 'Button';


/**
 * Thumb
 */
proto.thumbnailTpl = `
<button class="block-trigger-button" data-block-button>☄</button>
`;



module.exports = Trigger;