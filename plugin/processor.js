/**
 * Processor block processor.
 * Takes a function to process buffer.
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
 * Create processor based of function
 *
 * @constructor
 */
class Processor extends Lab.Block {
	constructor (options) {
		super(options);

		var self = this;

		//show code in textarea
		self.textarea = q('[data-processor-code]', self.content);
		self.textarea.value = self.toJSON().process;

		self.codemirror = CodeMirror.fromTextArea(self.textarea, {
			node: {name: "javascript", json: true},
			value: self.textarea.value,
			viewportMargin: Infinity
		});

		self.draggable.update();

		//attach processor
		self.setFunction(self.process, true);

		on(self.codemirror, 'change', function (i, ch) {
			var src = self.codemirror.getValue();
			self.setFunction(src);
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

		//save processor function
		var fnStr = fnbody(self.process);

		data.process = fnStr;

		return data;
	}
}


var proto = Processor.prototype;


proto.className = 'Processor';


/**
 * Processor layout
 */
proto.contentTpl = `
function (t, i, sample) {
<textarea class="block-code" rows="10" data-processor-code></textarea>
}
`;

proto.thumbnailTpl = `
<style>
.block-processor-thumbnail {
	font-family: serif;
	font-style: italic;
	font-size: 2.4rem;
	font-weight: bolder;
}
</style>
<span class="block-processor-thumbnail">f</span>
`;


/**
 * Default generator function
 */
proto.process = function (e) {
	var time = e.time;
	var f = (88%t);
	return Math.cos(2*Math.PI*f*t);
};


/**
 * Resetup processor from string or function
 */
proto.setFunction = function (fn, setValue) {
	var self = this;

	if (isString(fn)) {
		//allow strange syntax
		fn = fn.replace(/\n\s*/g, '\n');
		fn = new Function ('t', 'i', 'sample', fn);
	}

	var isActive = self.isActive;

	isActive && self.stop();

	self.process = fn;

	var value = self.toJSON().process;

	setValue && self.codemirror.setValue(value);

	//create processor node
	self.node = baudio(self.context, self.process);

	self.node.x = 1;
	self.start();

	self.emit('change');

	return self;
};


/** Default name */
proto.label = 'Processor';


module.exports = Processor;