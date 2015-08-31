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
 * comparing to scriptProcessorNode
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

		//offset identifies last loaded data within buffer
		self.offset = 0;

		//count represents the absolute data played
		self.count = 0;

		//audioBufferSourceNode
		self.bufferNode = self.context.createBufferSource();
		self.bufferNode.loop = true;
		self.bufferNode.buffer = self.context.createBuffer(1, self.bufferSize, self.context.sampleRate);
		self.bufferNode.connect(self.context.destination);
		self.bufferNode.start();

		//save the time buffer started, to exclude time it wasn't sending data
		self.initialTime = self.context.currentTime;

		self.buffer = self.bufferNode.buffer;

		return self;
	}


	/**
	 * Write chunk of data to audio destination.
	 */
	_write (chunk, encoding, callback) {
		var self = this;

		//if buffer is full - wait smallest possible time (next processor tick)
		if (!self.isAvailableRoomFor(chunk)) {
			setTimeout(function () {
				self._write(chunk, encoding, callback);
			});
			return;
		}

		var buffer = self.buffer;
		var chunkLength = Math.floor(chunk.length / 4);

		var offsetBefore = self.offset;

		//fill the buffer
		for (var channel = 0; channel < buffer.numberOfChannels; channel++) {
			var data = buffer.getChannelData(channel);
			for (var i = 0; i < chunkLength; i++) {
				data[self.offset] = chunk.readFloatLE(i*4);

				self.offset++;
				self.count++;

				//reset offset
				if (self.offset >= buffer.length) {
					self.offset = 0;
				}
			}
		}

		callback();
	}

	/** Check whether it is possible to fit some more data to the buffer */
	isAvailableRoomFor (chunk) {
		var self = this;

		var buffer = self.buffer;
		var chunkLength = Math.floor(chunk.length / 4);
		var chunkDuration = chunkLength / self.context.sampleRate;


		//get time of a current offset within the buffer
		var currentOffsetTime = self.count / self.context.sampleRate;


		// debug
		// var offset = self.offset;
		// var currentTime = self.context.currentTime - self.initialTime;
		// var currentTimeOffset = Math.floor((currentTime * self.context.sampleRate) % buffer.length);

		// draw(buffer, function (canvas) {
		// 	var ctx = canvas.getContext('2d');
		// 	var width = canvas.width;
		// 	var height = canvas.height;

		// 	var step = (width / buffer.length);

		// 	//draw buffering chunk
		// 	ctx.fillStyle = 'rgba(255,0,0,.5)';
		// 	ctx.fillRect(offset * step, 0, chunkLength * step, height);

		// 	//draw current time
		// 	ctx.fillStyle = 'blue';
		// 	ctx.fillRect(currentTimeOffset * step, 0, 1, height);
		// 	// ctx.fillRect(currentTimeOffset * step, 0, 1, height);

		// 	//draw stats
		// 	var diff = currentTimeOffset - self.lastOffset;
		// 	self.lastOffset = currentTimeOffset;
		// 	ctx.fillStyle = 'rgba(255,255,255,.8)';
		// 	ctx.fillRect(0, height - 20, height - 5, width - 10);
		// 	ctx.fillStyle = 'black';
		// 	ctx.fillText(`now: ${currentTime.toFixed(5)} limit: ${(currentTime + self.buffer.duration).toFixed(5)} offset: ${currentOffsetTime.toFixed(5)}`, 5, height - 5, width - 10);
		// });

		//check if new hypothetical offset would fit before the current time offset
		return self.context.currentTime - self.initialTime + self.buffer.duration > currentOffsetTime + chunkDuration;
	}
}


//just draw a new waveform canvas
var canvas = document.createElement('canvas');
canvas.width = 200;
canvas.height = 150;


//draw buffer, highlight the subset
var renderCount = 0;
function draw (buffer, fn) {
	var data = new Float32Array(buffer.length);
	buffer.copyFromChannel(data, 0);
	if (renderCount++ > 300) return;
	raf(function () {
		canvas = canvas.cloneNode();
		document.body.appendChild(canvas);

		var ctx = canvas.getContext('2d');
		var width = canvas.width;
		var height = canvas.height;

		ctx.clearRect(0,0,width,height);

		//draw buffer
		ctx.fillStyle = 'black';

		var step = Math.ceil( data.length / width );
		var amp = height / 2;

		for(var i=0; i < width; i++){
			var min = 1.0;
			var max = -1.0;

			for (var j=0; j<step; j++) {
				var datum = data[(i*step)+j];
				if (datum < min)
					min = datum;
				if (datum > max)
					max = datum;
			}
			ctx.fillRect(i,(1+min)*amp,1,Math.max(1,(max-min)*amp));
		}

		fn(canvas);
	});
}


var proto = Output.prototype;


/** Number of channels to use as an output */
proto.channels = 1;


/**
 * Output buffer size
 * Smaller sizes are dangerous due to interference w/processor ticks
 * If GC is noticeable - increase that
 */
proto.bufferSize = 256 * 16;


export default Output;



// proto.className = 'Output';


// proto.numberOfOutputs = 0;
// proto.numberOfInputs = Infinity;


// /** Default title */
// proto.title = 'Speaker';


// /**
//  * Thumb
//  */
// proto.thumbnailTpl = `
// <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -3 100 75"><path d="M6.988 16.6C2.132 16.6 0 28.03 0 36.8c0 8.77 2.275 19.938 6.456 19.938h10.878c6.448 0 16.465 10.998 21.532 15.22 3.643 3.034 9.998 1.95 9.998-4.502l.013-61.602c0-6.22-6.412-7.25-10.007-4.08-5.262 4.635-14.946 14.822-21.267 14.822H6.988zM69.578 13.668c-1.904-1.882-4.93-1.882-6.842.013-1.888 1.892-1.888 4.944.01 6.842v-.01c4.173 4.175 6.75 9.907 6.75 16.266 0 6.347-2.568 12.065-6.74 16.23-1.908 1.905-1.908 4.954-.01 6.865.934.94 2.17 1.416 3.416 1.416 1.247 0 2.522-.478 3.428-1.417 5.898-5.905 9.566-14.093 9.566-23.08.005-9.027-3.676-17.227-9.578-23.125z"/><path d="M85.324 1.463c-1.97-1.95-5.094-1.95-7.057 0-1.96 1.952-1.96 5.116 0 7.058C85.51 15.76 90.02 25.726 90.02 36.776s-4.47 20.996-11.744 28.25c-1.973 1.945-1.973 5.093 0 7.053.942.965 2.252 1.467 3.538 1.467 1.28 0 2.6-.503 3.53-1.467 9.043-9.036 14.67-21.533 14.657-35.303-.043-13.765-5.638-26.292-14.676-35.312z"/></svg>
// `;



// module.exports = Output;