var cron = require('node-cron');
var wisepoint = require('./cron/wisepoint');
var pieces = require('./cron/pieces.js');

cron.schedule('0 2 * * *', () => {
	console.log('Schedule started - ' + new Date());
	wisepoint.startProcess();
	pieces.startProcess();
	console.log('Schedule ended - ' + new Date());
});
