const config = require('./config')
const env = 'local'

global.__root = __dirname

const
	express = require('express'),
	compression = require('compression'),
	// staticCache = require('express-static-cache')
	serveStatic = require('serve-static'),
	path = require('path'),
	bodyParser = require('body-parser'),
	// multer = require('multer'),
	request = require('request'),
	countriesList = require('countries-list'),
	Mailgun = require('mailgun').Mailgun

let mailgun = new Mailgun(config.MAILGUN.APIKEY)

let app = express()

app.use(compression())
app.use('/assets', serveStatic(path.join(__dirname, 'assets'), {
	setHeaders: function (res, path, stat) {
		res.set('Access-Control-Allow-Origin', '*')
		res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
		// res.set('Cache-Control', 'public, max-age=259200')
	},
	// maxAge: (5 * 60) * 1000,
	dotfiles: 'ignore'
}))

app.use('/uploads', serveStatic(path.join(__dirname, 'uploads')))

app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())

var mongoose = require('mongoose')
mongoose.Promise = Promise
let connection = mongoose.connect(config.MONGO[env].DSN)
global.models = {
	User: require('./models/user')(connection),
	Token: require('./models/token')(connection),
	Article: require('./models/article')(connection),
	Comment: require('./models/comment')(connection),
	PostReaction: require('./models/postreaction')(connection),
	CommentReaction: require('./models/commentreaction')(connection),
	PhoneVerification: require('./models/phoneverification')(connection),
	ResetPassword: require('./models/resetpassword')(connection),
	FindAccount: require('./models/findaccount')(connection),
}


app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'index.htm'))
})

app.get('/static/countries', (req, res) => {
	let countryPhoneCodeList = []

	for (let code in countriesList.countries) {
		let item = countriesList.countries[code]

		countryPhoneCodeList.push({
			title: `${item.name} +${item.phone}`,
			country: item.name,
			code: item.phone
		})
		// countryPhoneCodeList.push(`${item.name}`)
	}

	res.send(countryPhoneCodeList)
})

let userRoutes = require('./routes/user')
app.use(userRoutes)

let articleRoutes = require('./routes/article')
app.use('/article', articleRoutes)

app.listen(8006, () => {
	console.log('kek')
})
