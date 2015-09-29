/**
 * Example of generated labfile for a musical piece
 */


/** Import blocks */
var Generator = require('./plugins/generator');
var Output = require('./plugins/output');
var Gain = require('./plugins/gain');


/** Create blocks */
var generator = new Generator(function (t) {
	return Math.sin(t * Math.PI * 2 * 440);
});

var output = new Output({
	channels: 2
});


/** Connect graph */
generator.pipe(output);