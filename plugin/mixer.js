/**
 * Mix multiple inputs
 */

var Block = require('../').Block;


class Mixer extends Block {
	constructor () {
		super();
	}


	_transform () {
		var self = this;

		var outBuff = [];

		//go by input buffers, mix them in equal proportions
		self.inputs.forEach(function (connection, i) {
			outBuff =
		});

	}
}


Mixer.prototype.numberOfInputs = Infinity;
Mixer.prototype.numberOfOutputs = 1;