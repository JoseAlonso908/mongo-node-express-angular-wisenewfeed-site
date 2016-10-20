const
	express = require('express'),
	path = require('path')
let app = express()

app.use('/assets', express.static('assets'))

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'index.htm'))
})

app.listen(8006, () => {
	console.log('kek')
})