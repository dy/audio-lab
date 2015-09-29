/**
 * Mix multiple input streams syncronously.
 * Each input stream pipes to own writable stream instance
 * to control it’s pressure to sync output data.
 * So mixer stream is basically readable stream
 * which takes the data from multiple sources of writable streams,
 * as awkward as it might sound.
 */

import {Readable, Writable, Duplex} from 'stream';


/**
 * Duplex stream to be able to pipe in
 */
class Mixer extends Duplex {
	constructor (options) {
		super();

		var self = this;

		self.setMaxListeners(100);

		//input streams
		self.inputs = [];

		//input pressure controllers - writables
		self.controllers = [];

		//input streams data
		self.data = [];

		//register piped inputs
		self
		.on('pipe', function (stream) {
			self.add(stream);
		})
		.on('unpipe', function (stream) {
			self.delete(stream);
		});

		//current mixed byte count
		self.count = 0;
	}


	/** Just a stub to pipe in */
	_write (chunk, enc, cb) {
		cb();
	}


	/**
	 * Consumer wants more.
	 * Try to merge frame
	 */
	_read (size) {
		this.stopped = false;
		this._mergeFrame();
	}


	/**
	 * Slice data from every input, mix it, push
	 */
	_mergeFrame () {
		var self = this;

		//don’t overfeed the consumer
		if (self.stopped) {
			return false;
		}

		//ignore zero inputs
		if (!self.inputs.length) return false;

		//release inputs to generate some more data
		self.data.forEach(function (data, i) {
			if (data.length < self.blockSize * 4) {
				var ready = self.controllers[i].ready;
				self.controllers[i].ready = null;
				ready && ready.call(self.controllers[i]);
			}
		});

		//if there is still not enough data - ignore
		if (self.data.some(function (data) {
			return data.length < self.blockSize*4;
		})) {
			return false;
		}

		//merge inputs into the chunk
		var chunk = new Buffer(self.blockSize*4);

		for (var i = 0; i < self.blockSize; i++) {
			var sum = 0;
			self.data.forEach(function (data) {
				sum += data.readFloatLE(i * 4);
			});
			chunk.writeFloatLE(sum/self.inputs.length, i*4);
			self.count++;
		}

		//slice data
		self.data = self.data.map(function (data) {
			return data.slice(self.blockSize * 4);
		});

		//try to push some more
		if (self.push(chunk)) {
			self._mergeFrame();
		}
		//or stop if reader is full
		//hold on inputs as well
		else {
			self.stopped = true;
		}
	}


	/**
	 * Explicit way to add streams.
	 * Same as `stream.pipe(mixer);`
	 *
	 * @param {Stream} stream A stream to add
	 */
	add (stream) {
		var self = this;

		var streamIdx = self.inputs.length;

		//save input
		self.inputs.push(stream);
		self.data.push(new Buffer(0));

		//create pressure controller
		var pressureController = new Writable();
		self.controllers.push(pressureController);

		//once writable gets data - it should wait for others
		pressureController._write = function (chunk, encoding, cb) {
			//save data
			self.data[streamIdx] = Buffer.concat([self.data[streamIdx], chunk]);

			//save last callback to wait for others
			pressureController.ready = cb;

			//try to merge a chunk to an output
			self._mergeFrame();
		};

		stream.pipe(pressureController);

		return self;
	}

	/**
	 * Explicit way to delete inputs
	 */
	delete (stream) {
		var self = this;

		var streamIdx = self.inputs.indexOf(stream);

		if (streamIdx < 0) return;

		self.inputs[streamIdx].unpipe(self.controllers[streamIdx]);

		self.inputs.splice(streamIdx, 1);
		self.data.splice(streamIdx, 1);
		self.controllers.splice(streamIdx, 1);

		return self;
	}
}

/** Size of a single chunk to pack output data */
Mixer.prototype.blockSize = 64;


export default Mixer;