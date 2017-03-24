const config = require('./config')
const env = 'development'

global.__root = __dirname

const
	express = require('express')
	exphbs = require('express-handlebars'),
	compression = require('compression'),
	// staticCache = require('express-static-cache')
	serveStatic = require('serve-static'),
	path = require('path'),
	bodyParser = require('body-parser'),
	// multer = require('multer'),
	request = require('request'),
	countriesList = require('countries-list'),
	_ = require('lodash'),
	Mailgun = require('mailgun').Mailgun

global.mailgun = new Mailgun(config.MAILGUN.APIKEY)

let app = express()

app.engine('handlebars', exphbs())
app.set('view engine', 'handlebars')

app.disable('x-powered-by')
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

    models.Article.postsCountPerCountry().then(counted => {
        const indexedByCountry = _.keyBy(counted, 'country')
        for (let countryCode in countriesList.countries) {
            let country = countriesList.countries[countryCode]
            if (!country.count) country.count = 0

            let transformedName = models.Article.transformToTag(country.name)
            if (indexedByCountry.hasOwnProperty(transformedName)) {
                country.count = indexedByCountry[transformedName].count
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
            count: 0,
        })
        res.send(result)

    }).catch(err => {
        console.log(err)
        res.status(500).json({ok: false})
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

app.get('/static/cities', (req, res) => {
	const cc = require('countries-cities')
	let cities = cc.getCities(req.query.country) || []

	cities = cities.sort()

	res.send(cities)
})

global.getCategories = () => {
	return [
		{id: 0, title: 'All', tag: '', count: 0},
		{id: 1, title: 'News', tag: 'news', count: 0},
		{id: 2, title: 'Local News', tag: 'localnews', count: 0},
		{id: 3, title: 'Health', tag: 'health', count: 0},
		{id: 4, title: 'Entertainment', tag: 'entertainment', count: 0},
		{id: 5, title: 'Tech', tag: 'tech', count: 0},
		{id: 6, title: 'Lifestyle', tag: 'lifestyle', count: 0},
		{id: 7, title: 'Sports', tag: 'sports', count: 0},
		{id: 8, title: 'Buzz', tag: 'buzz', count: 0},
		{id: 9, title: 'Personal development', tag: 'personaldevelopment', count: 0},
		{id: 10, title: 'People', tag: 'people', count: 0},
		{id: 11, title: 'Culture', tag: 'culture', count: 0},
		{id: 12, title: 'Media', tag: 'media', count: 0},
		{id: 13, title: 'Arts and design', tag: 'artsanddesign', count: 0},
		{id: 14, title: 'History', tag: 'history', count: 0},
		{id: 15, title: 'Fashion', tag: 'fashion', count: 0},
		{id: 16, title: 'Literature', tag: 'literature', count: 0},
		{id: 17, title: 'Laws', tag: 'laws', count: 0},
		{id: 18, title: 'Real Estate', tag: 'realestate', count: 0},
		{id: 19, title: 'Religion', tag: 'religion', count: 0},
		{id: 20, title: 'Lesson learned', tag: 'lessonlearned', count: 0},
		{id: 21, title: 'Partnership', tag: 'partnership', count: 0},
		{id: 22, title: 'Other', tag: 'other', count: 0},
	]
}


// TODO: move this to cron
app.get('/static/categories', (req, res) => {
	let {country} = req.query

	let categories = getCategories()

	// models.Article.getByUsers([], null, [], null, country, null, null, (err, articles) => {
	models.Article.getByUsers({authors:[], viewer: null, shares: [], category: null, country}, (err, articles) => {
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

app.get('/permarticle/:id', (req, res) => {
	let {id} = req.params

    models.Article.findOneById(id, (err, article) => {
    	article.text = article.text
			.replace(/<.+?>/gi, '')
			.replace('&amp;', '&')
			.replace('&nbsp;', ' ')

    	// res.send(article)
        res.render('article', {article})
	})
})

global.events = new (require('events'))()

const server = app.listen(8006)
const io = require('socket.io')(server)
global.ws = require('./routes/ws')(io)

app.use(require('./routes/general'))
app.use('/user', require('./routes/user'))
app.use('/image', require('./routes/image'))
app.use('/article', require('./routes/article'))
app.use('/follow', require('./routes/follow'))
app.use('/friendship', require('./routes/friendship'))
app.use('/n', require('./routes/notification'))
app.use('/questions', require('./routes/question'))
app.use('/chat', require('./routes/chat'))
app.use('/beta', require('./routes/beta'))
