var cron = require('node-cron');
var wisepoint = require('./cron/wisepoint');
// var pieces = require('./cron/pieces.js');

cron.schedule('0 2 * * *', () => {
	console.log('Schedule started - ' + new Date());
	wisepoint.startProcess();
	console.log('Schedule ended - ' + new Date());
});

/*
cron.schedule('0 2 * * *', () => {
	console.log('Pieces started - ' + new Date());
	pieces.startProcess();
	console.log('Pieces ended - ' + new Date());
});
*/
