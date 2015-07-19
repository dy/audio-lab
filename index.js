var lab = require('./lib/application');

//register default set of blocks

lab.use([
	require('./lib/radio'),
	require('./lib/oscillator'),
	require('./lib/output'),
	require('./lib/generator'),
	require('./lib/analyser'),
	require('./lib/microphone'),
	require('./lib/gain'),
	require('./lib/piano')
]);


module.exports = lab;