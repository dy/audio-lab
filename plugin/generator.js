/**
 * Generator is a simpliest readable stream.
 */

import { Readable } from 'stream';
import extend from 'xtend/mutable';


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

		//current item number
		self.count = 0;
	}


	/** Generate chunk */
	_generate () {
		var self = this;

		var chunk = new Buffer(self.sampleSize * 4);

		var t = self.count / self.sampleRate;

		for (var i = 0; i < self.sampleSize; i++) {
			chunk.writeFloatLE(self.generate(t + i / self.sampleRate), i*4);
		}

		self.count += self.sampleSize;

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
		return Math.random();
	}
}


Generator.prototype.sampleSize = 32;
Generator.prototype.sampleRate = 44100;



export default Generator;