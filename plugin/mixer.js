/**
 * Mix multiple input streams syncronously.
 * Each input stream gets it’s own writable stream
 * to be able to control it’s pressure to sync output data.
 * So mixer stream is basically readable stream
 * which takes the data from multiple sources of writable streams,
 * as awkward as it might sound.
 */

import {Readable, Writable, Duplex} from 'stream';


/**
 * Mixer by fact is a duplex stream, but it is able to take multiple inputs.
 */
class Mixer extends Duplex {
	constructor (options) {
		super();

		var self = this;

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
		})

		//current mixed byte count
		self.count = 0;
	}


	/** Just a stub to pipe in */
	_write (chunk, enc, cb) {
		// console.log('_writeFake')
		// setTimeout(cb);
		cb();
	}


	/**
	 * Consumer wants more.
	 * Try to merge frame, if available
	 */
	_read (size) {
		this.stopped = false;
		// console.log('_read')
		this._mergeFrame();
	}


	/**
	 * Try to merge & push another frame
	 */
	_mergeFrame () {
		var self = this;

		//if is stopped - don’t overfeed consumer
		if (self.stopped) {
			// console.log('overfeed')
			return false;
		}

		//ignore zero inputs
		if (!self.inputs.length) return false;

		// console.log('_mergeFrame')

		//try to fill blocks
		self.data.forEach(function (data, i) {
			if (data.length < self.blockSize * 4) {
				var ready = self.controllers[i].ready;
				self.controllers[i].ready = null;
				ready && ready.call(self.controllers[i]);
			}
		});

		//if there is no enough data - ignore
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
		}

		//slice data
		self.data = self.data.map(function (data) {
			return data.slice(self.blockSize * 4);
		});

		if (self.push(chunk)) {
			//notify each pressure controller to be ready to read more
			self.controllers.forEach(function (controller) {
				var ready = controller.ready;
				controller.ready = null;
				ready && ready.call(controller);
			});

			//try to push some more
			self._mergeFrame();
		}
		else {
			// console.log('full')
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
			// console.log('_write')
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

		//TODO

		// self.inputs.delete(stream);

		// stream.off('data', );

		return self;
	}
}

/** Size of a single chunk to pack output data */
Mixer.prototype.blockSize = 128;


export default Mixer;