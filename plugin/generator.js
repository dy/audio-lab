/**
 * Generator is a simpliest readable stream.
 */

import { Readable } from 'stream';
import context from 'audio-context';
import extend from 'xtend/mutable';


const BLOCK_SIZE = 512*5;


/**
 * In real-time generation we have to make sure that generated data isn’t sent more often than a real time
 *
 * @class Generator
 */
class Generator extends Readable {
	constructor (opts) {
		super(opts);

		var self = this;

		//take over options
		extend(self, opts);

		//ensure context
		if (!self.context) {
			self.context = context;
		}

		//initial time is 0
		//FIXME: remove with external time
		self.t = self.context.currentTime;
		self.rate = self.context.sampleRate;

		//generate chunk beforehead
		self._generate();
	}


	/** Generate chunk */
	_generate () {
		var self = this;

		self._chunk = new Buffer(BLOCK_SIZE * 4);
		for (var i = 0; i < BLOCK_SIZE; i++) {
			var t = self.t + i / self.rate;
			self._chunk.writeFloatLE(self.generate(t), i*4);
		}

		self.t += BLOCK_SIZE / self.rate;
	}


	/**
	 * Read is called each time the connected block
	 * is ready to eat some more generated data.
	 *
	 * @param {Number} size Number of bytes to generate
	 */
	_read (size) {
		var self = this;

		//send the chunk
		self.push(self._chunk);

		self._generate();
	}


	/**
	 * User generator method, supposed to be overridden
	 * Returns value
	 */
	generate () {
		return Math.random();
	}
}



export default Generator;