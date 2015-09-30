/**
 * Generator is a simpliest readable stream.
 */

import { Readable } from 'stream';
import extend from 'xtend/mutable';
import {log} from '../lib/debug';


/**
 * @class Generator
 */
class Generator extends Readable {
	constructor (opts) {
		super();

		var self = this;

		if (typeof opts === 'function') {
			self.generate = opts;
		}
		//take over options
		else {
			extend(self, opts);
		}


		//current item number
		self.count = 0;
	}


	/** Generate chunk */
	_generate () {
		var self = this;

		var chunk = new Buffer(self.blockSize * 4);

		var t = self.count / self.rate;
		var value;

		for (var i = 0; i < self.blockSize; i++) {
			value = Math.min(Math.max(-1, self.generate(t + i / self.rate) || 0), 1);
			chunk.writeFloatLE(value, i*4);
		}

		self.count += self.blockSize;

		return chunk;
	}


	/**
	 * Read is called each time the connected block
	 * is ready to eat some more generated data.
	 * So feed it till consumer is full.
	 *
	 * @param {Number} size Number of bytes to generate
	 */
	_read (size) {
		var self = this;

		//send the chunk till possible
		while (self.push(self._generate())) {
		}
	}


	/**
	 * User generator method, supposed to be overridden
	 * @param {number} time current time
	 * @return {number} [-1..1]
	 */
	generate (time) {
		return Math.sin(Math.PI * 2 * time * 110 + Math.sin(Math.PI * 2 * time * 1) * 20 ) / 10;
		// return Math.random();
	}
}


Generator.prototype.blockSize = 64;
Generator.prototype.rate = 44100;


/** Audio-lab rendering settings */
Generator.prototype.numberOfOutputs = 1;
Generator.prototype.numberOfInputs = 0;
Generator.title = 'Generator';


/** Interface */

var fnbody = require('fnbody');

Generator.prototype.createElement = function (container) {
	var self = this;

	var CodeMirror = require('codemirror');
	var cmMode = require('codemirror/mode/javascript/javascript');
	var isFn = require('is-function');
	var on = require('emmy/on');
	var off = require('emmy/off');
	var q = require('queried');
	var autosize = require('autosize');
	var domify = require('domify');

	//create element content
	self.element = domify(`
		function (time) {
		<textarea class="block-code" rows="10" data-generator-code></textarea>
		}
	`);
	container.appendChild(self.element);

	//show code in textarea
	self.textarea = q('[data-generator-code]', container);
	self.textarea.value = fnbody(self.generate);

	//create codemirror wrapper over the textarea
	self.codemirror = CodeMirror.fromTextArea(self.textarea, {
		node: {name: "javascript", json: true},
		value: self.textarea.value,
		viewportMargin: Infinity
	});

	//attach processor
	self.setFunction(self.generate, true);

	on(self.codemirror, 'change', function (i, ch) {
		var src = self.codemirror.getValue();
		self.setFunction(src);
	});

	return self.element;
}


/** Set new generator function */
Generator.prototype.setFunction = function (fn, setValue) {
	var self = this;

	if (typeof fn === 'string') {
		//allow strange syntax
		fn = fn.replace(/\n\s*/g, '\n');
		fn = new Function ('time', fn);
	}

	self.generate = fn;

	var value = fnbody(self.generate);

	setValue && self.codemirror.setValue(value);

	self.emit('change');

	return self;
};


/** Save */
Generator.prototype.toJSON = function () {
	return {
		generate: fnbody(this.generate)
	};
}



export default Generator;