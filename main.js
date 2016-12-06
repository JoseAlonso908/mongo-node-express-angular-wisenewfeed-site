const config = require('./config')
const env = 'development'

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

app.use((req, res, next) => {
	// res.set('Cache-Control', 'max-age=3')
	next()
})

global.models = require('./model')(config.MONGO[env].DSN, __dirname)

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'index.htm'))
})

app.get('/static/countries/grouped', (req, res) => {
	let result = []

	for (let continentCode in countriesList.continents) {
		let continent = countriesList.continents[continentCode]

		result.push({
			id: continentCode,
			title: continent,
			sub: [],
		})
	}

	for (let countryCode in countriesList.countries) {
		let country = countriesList.countries[countryCode]

		for (let continent of result) {
			if (continent.id == country.continent) {
				continent.sub.push({
					id: countryCode,
					title: country.name
				})
			}
		}
	}

	res.send(result)
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
	}

	res.send(countryPhoneCodeList)
})

global.getCategories = () => {
	return [
		{id: 1, title: 'World News', count: 0},
		{id: 2, title: 'Canada News', count: 0},
		{id: 3, title: 'Buzz News', count: 0},
		{id: 4, title: 'Science', count: 0},
		{id: 5, title: 'Business', count: 0},
		{id: 6, title: 'Health', count: 0},
		{id: 7, title: 'Technology', count: 0},
		{id: 8, title: 'Sport', count: 0},
		{id: 9, title: 'Entertainment', count: 0},
	]
}

app.get('/static/categories', (req, res) => {
	let {country} = req.query

	let categories = getCategories()

	models.Article.getAllLean((err, articles) => {
		for (let article of articles) {
			if (!article.author) continue
			if (country && article.country != country) continue

			for (let category of categories) {
				if (article.category == category.title) {
					category.count++
					break
				}
			}
		}

		res.send(categories)
	})
})

app.use(require('./routes/general'))
app.use(require('./routes/user'))
app.use('/article', require('./routes/article'))
app.use('/follow', require('./routes/follow'))
app.use('/n', require('./routes/notification'))
app.use('/questions', require('./routes/question'))

app.listen(8006, () => {
	console.log('kek')
})
