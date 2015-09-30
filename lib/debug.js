/**
 * Debug helper
 */
import raf from 'component-raf';


//just draw a new waveform canvas
var canvas = document.createElement('canvas');
canvas.width = 200;
canvas.height = 150;


//draw buffer, highlight the subset
var renderCount = 0;
function draw (data, cb) {
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

		var step = data.length / width;
		var amp = height / 2;

		for(var i=0; i < width; i++){
			ctx.fillRect(i, data[Math.round(step * i)] * amp + amp, 1, 1);
		}

		cb(canvas);
	});
}

/** Throttled log */
var pause = false;
function log () {
	if (!pause) {
		pause = true;
		console.log(...arguments);
		setTimeout(function () {
			pause = false;
		}, 50);
	}
}


export default {
	draw,
	log
}
