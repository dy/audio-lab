/**
 * Generator block processor.
 * Takes a function to generate buffer.
 */

var Lab = require('../');
var isFn = require('is-function');
var on = require('emmy/on');
var off = require('emmy/off');
var q = require('queried');
var autosize = require('autosize');
var baudio = require('webaudio');
var inherits = require('inherits');
var isString = require('mutype/is-string');
var fnbody = require('fnbody');
var CodeMirror = require('codemirror');
var cmMode = require('codemirror/mode/javascript/javascript')



/**
 * Create generator based of function
 *
 * @constructor
 */
class Generator extends Lab.Block {
	constructor (options) {
		super(options);

		var self = this;

		//show code in textarea
		self.textarea = q('[data-generator-code]', self.content);
		self.textarea.value = self.toJSON().generate;

		self.codemirror = CodeMirror.fromTextArea(self.textarea, {
			node: {name: "javascript", json: true},
			value: self.textarea.value
		});

		self.draggable.update();

		//attach generator
		self.setGenerator(self.generate, true);

		on(self.codemirror, 'change', function (i, ch) {
			var src = self.codemirror.getValue();
			self.setGenerator(src);
		});

		//go ready state
		self.state = 'ready';

		return self;
	}


	/**
	 * Destroy additional things
	 */
	destroy () {
		var self = this;

		autosize.destroy(self.textarea);
		self.autosize = null;

		off(self.textarea);
		self.textarea = null;

		super.destroy();
	}


	/**
	 * Represent instance as JSON
	 */
	toJSON () {
		var self = this;

		var data = super.toJSON();

		//save generator function
		var fnStr = fnbody(self.generate);

		data.generate = fnStr;

		return data;
	}
}


var proto = Generator.prototype;


proto.className = 'Generator';

proto.numberOfInputs = 0;


/**
 * Generator layout
 */
proto.contentTpl = `
function (t, i, sample) {
<textarea class="block-code" rows="10" data-generator-code></textarea>
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
proto.generate = function (t, i, sample) {
	var f = (88%t);
	return Math.cos(2*Math.PI*f*t);
};


/**
 * Resetup generator from string or function
 */
proto.setGenerator = function (fn, setValue) {
	var self = this;

	if (isString(fn)) {
		//allow strange syntax
		// fn = fn.replace(/^\n\s*/g, '\n');
		fn = new Function ('t', 'i', 'sample', fn);
	}

	var isActive = self.isActive;

	isActive && self.stop();

	self.generate = fn;

	var value = self.toJSON().generate;

	setValue && self.codemirror.setValue(value);

	//create generator node
	self.node = baudio(self.context, self.generate);

	isActive && self.start();

	self.emit('change');

	return self;
};


module.exports = Generator;