var cron = require('node-cron');
var wisepoint = require('./cron/wisepoint');

cron.schedule('0 2 * * *', () => {
	console.log('Schedule started - ' + new Date());
	wisepoint.startProcess();
	console.log('Schedule ended - ' + new Date());
});
