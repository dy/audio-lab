var Lab = require('./lib/lab');

//export classes
Lab.Block = require('./lib/block');
Lab.Connection = require('./lib/connection');


module.exports = Lab;


//register default blocks
Lab.use([
	require('./plugin/output'),
	require('./plugin/generator')
]);