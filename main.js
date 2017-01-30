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

global.mailgun = new Mailgun(config.MAILGUN.APIKEY)

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

global.models = require('./model')(config.MONGO[env].DSN, __dirname).models()

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'index.htm'))
})

let getCountries = () => {
	return JSON.parse(JSON.stringify(countriesList))
}

app.get('/static/countries/grouped', (req, res) => {
	let {category} = req.query

	let result = []

	let countriesList = getCountries()

	for (let continentCode in countriesList.continents) {
		let continent = countriesList.continents[continentCode]

		result.push({
			id: continentCode,
			title: continent,
			sub: [],
		})
	}

	models.Article.getByUsers([], null, [], category, null, null, null, (err, articles) => {
		for (let countryCode in countriesList.countries) {
			let country = countriesList.countries[countryCode]
			if (!country.count) country.count = 0

			for (let article of articles) {
				if (country.name == article.country) {
					country.count++
				}
			}

			for (let continent of result) {
				continent.count = 0

				if (continent.id == country.continent) {
					continent.sub.push({
						id: countryCode,
						title: country.name,
						count: country.count,
					})
				}
			}
		}

		result.unshift({
			id: 0,
			title: 'All',
			count: articles.length,
		})

		res.send(result)
	})
})

app.get('/static/countries', (req, res) => {
	let countryPhoneCodeList = []

	for (let code in countriesList.countries) {
		let item = countriesList.countries[code]
		if (!item.phone) continue

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
		{id: 0, title: 'All', tag: '', count: 0},
		{id: 1, title: 'World News', tag: 'worldnews', count: 0},
		{id: 2, title: 'Canada News', tag: 'canadanews', count: 0},
		{id: 3, title: 'Buzz News', tag: 'buzznews', count: 0},
		{id: 4, title: 'Science', tag: 'science', count: 0},
		{id: 5, title: 'Business', tag: 'business', count: 0},
		{id: 6, title: 'Health', tag: 'health', count: 0},
		{id: 7, title: 'Technology', tag: 'technology', count: 0},
		{id: 8, title: 'Sport', tag: 'sport', count: 0},
		{id: 9, title: 'Entertainment', tag: 'entertainment', count: 0},
	]
}

// TODO: move this to cron
app.get('/static/categories', (req, res) => {
	let {country} = req.query

	let categories = getCategories()

	models.Article.getByUsers([], null, [], null, country, null, null, (err, articles) => {
		categories[0].count = articles.length

		for (let category of categories) {
			category.count = 0

			for (let article of articles) {
				if (!article.author) continue
				if (country && article.country != country) continue

				if (category.tag && (new RegExp(`\\$${category.tag}`, 'gi')).test(article.text)) {
					category.count++
				}
			}
		}

		res.send(categories)
	})
})

global.events = new (require('events'))()

app.use(require('./routes/general'))
app.use('/user', require('./routes/user'))
app.use('/article', require('./routes/article'))
app.use('/follow', require('./routes/follow'))
app.use('/n', require('./routes/notification'))
app.use('/questions', require('./routes/question'))
app.use('/chat', require('./routes/chat'))

const server = app.listen(8006)
const io = require('socket.io')(server)
global.ws = require('./routes/ws')(io)