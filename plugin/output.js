/**
 * Output stream - sends input data to an audioContext destination.
 */


import { Writable } from 'stream';
import context from 'audio-context';
import extend from 'xtend/mutable';
import raf from 'component-raf';


/**
 * Sound rendering is based on looping audiobuffer
 * it exposes the smallest possible latency avoiding GC
 * comparing to scriptProcessorNode.
 *
 * To make it realtime it is necessary to make sure that
 * buffer filling triggers stepped in equal intervals
 * regardless of the input data availability.
 *
 * But output is also via back-pressure mechanism controls how other nodes are rendered
 * In that, it is possible to render in background faster than realtime
 *
 * @constructor
 */
class Output extends Writable {
	constructor (options) {
		super(options);

		var self = this;

		extend(self, options);

		//ensure context
		if (!self.context) {
			self.context = context;
		}

		//offset identifies last loaded data within audio buffer
		self.offset = 0;

		//count represents the absolute data loaded within audio buffer
		self.count = 0;

		//audioBufferSourceNode, main output
		self.bufferNode = self.context.createBufferSource();
		self.bufferNode.loop = true;
		self.bufferNode.buffer = self.context.createBuffer(1, self.audioBufferSize, self.context.sampleRate);
		self.bufferNode.connect(self.context.destination);
		self.bufferNode.start();
		self.buffer = self.bufferNode.buffer;


		//ready data to play
		self.data = [];
		self.lastTime = self.context.currentTime;


		//audio buffer realtime ticked cycle
		self.bufferInterval = setInterval(function () {
			var timeSpent = self.context.currentTime - self.lastTime;
			var realCount = Math.floor(self.context.currentTime * self.context.sampleRate);

			//min chunk size is the time passed
			var chunkSize = Math.floor(timeSpent * self.context.sampleRate);

			//max chunk size is avail space up the next audio buffer cycle
			if (self.count <= realCount) {
				chunkSize = Math.max(chunkSize, (realCount - self.count) + self.buffer.length );
			}

			//fill chunk with available data and the rest - with zeros
			var channelData = self.buffer.getChannelData(0);
			var value;

			for (var i = 0; i < chunkSize; i++) {
				if (self.data.length) {
					value = self.data.shift();
				}
				else {
					value = 0;
				}

				channelData[self.offset++] = value;
				self.count++;

				// reset offset
				if (self.offset >= channelData.length) {
					self.offset = 0;
				}
			}

			self.emit('tick');

			self.lastTime = self.context.currentTime;
		});

		return self;
	}


	/**
	 * Write chunk of data to audio destination.
	 */
	_write (chunk, encoding, callback) {
		var self = this;

		var chunkLength = Math.floor(chunk.length / 4);

		//if data buffer is full - wait till next tick
		if (self.data.length + chunkLength >= self.bufferSize) {
			self.once('tick', function () {
			// setTimeout(function(){
				self._write(chunk, encoding, callback);
			});
			return;
		}

		//save the data
		for (var i = 0; i < chunkLength; i++) {
			self.data.push(chunk.readFloatLE(i*4));
		}

		callback();
	}
}


var proto = Output.prototype;


/** Number of channels to use as an output */
proto.channels = 1;


/**
 * Audio buffer size
 * Smaller sizes are dangerous due to interference w/processor ticks
 * If GC is noticeable - increase that
 */
proto.audioBufferSize = 256 * 8;


/**
 * Data buffer size
 * should be more than audio buffer size
 * to avoid filling with zeros
 */
proto.bufferSize = 256 * 16;







/** Default title */
Output.title = 'Speaker';


/**
 * Thumbnail
 */
Output.thumbnail = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -3 100 75"><path d="M6.988 16.6C2.132 16.6 0 28.03 0 36.8c0 8.77 2.275 19.938 6.456 19.938h10.878c6.448 0 16.465 10.998 21.532 15.22 3.643 3.034 9.998 1.95 9.998-4.502l.013-61.602c0-6.22-6.412-7.25-10.007-4.08-5.262 4.635-14.946 14.822-21.267 14.822H6.988zM69.578 13.668c-1.904-1.882-4.93-1.882-6.842.013-1.888 1.892-1.888 4.944.01 6.842v-.01c4.173 4.175 6.75 9.907 6.75 16.266 0 6.347-2.568 12.065-6.74 16.23-1.908 1.905-1.908 4.954-.01 6.865.934.94 2.17 1.416 3.416 1.416 1.247 0 2.522-.478 3.428-1.417 5.898-5.905 9.566-14.093 9.566-23.08.005-9.027-3.676-17.227-9.578-23.125z"/><path d="M85.324 1.463c-1.97-1.95-5.094-1.95-7.057 0-1.96 1.952-1.96 5.116 0 7.058C85.51 15.76 90.02 25.726 90.02 36.776s-4.47 20.996-11.744 28.25c-1.973 1.945-1.973 5.093 0 7.053.942.965 2.252 1.467 3.538 1.467 1.28 0 2.6-.503 3.53-1.467 9.043-9.036 14.67-21.533 14.657-35.303-.043-13.765-5.638-26.292-14.676-35.312z"/></svg>
`;
Output.prototype.numberOfOutputs = 0;
Output.prototype.numberOfInputs = 1;


export default Output;