/**
 * Simple volume regulator
 */

import extend from 'xtend/mutable';
import {Transform} from 'stream';


/**
 * Create generator based of function
 *
 * @constructor
 */
class Gain extends Transform {
	constructor (options) {
		super();

		var self = this;

		//shorthand option
		if (typeof options === 'number') {
			self.value = options;
		}

		//longhand option
		else {
			extend(self, options);
		}

		return self;
	}

	_transform (chunk, enc, cb) {
		var self = this;

		var chunkLen = Math.round(chunk.length / 4);

		for (var i = 0; i < chunkLen; i++) {
			var value = chunk.readFloatLE(i*4) * self.value;
			chunk.writeFloatLE(value, i*4);
		}

		cb(null, chunk);
	}
}


/** Value as a multiplier */
Gain.prototype.value = 0.5;



/**
 * Audio-lab
 */
/* proto.contentTpl = `
<input class="gain-value" type="range" value="1" step="0.01" min="0" max="1" orientation="vertical"/>
<button class="gain-mute">x</button>
`; */

Gain.title = 'Gain';
Gain.thumbnail = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 125"><path fill="none" stroke="#000" stroke-width="4.963" stroke-miterlimit="10" d="M91.75 69.492H17.583L91.75 39.508z"/><path d="M65.75 50.683l-45 18.192h45"/></svg>
`;



export default Gain;