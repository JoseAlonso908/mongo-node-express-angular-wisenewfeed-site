const config = require('./config')
const env = 'local'

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

app.use('/proxy', (req, res) => {
    let {url} = req.query;
    request.get(url).pipe(res);
})

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
		// { id: 0, title: 'All', tag: 'all', count: 0 },
		{ id: 1, title: 'Business Coaching', tag: 'businesscoaching', count: 0 },
		{ id: 2, title: 'Startup Coaching', tag: 'startupcoaching', count: 0 },
		{ id: 3, title: 'Finance Coaching', tag: 'financecoaching', count: 0 },
		{ id: 4, title: 'Real Estate Coaching', tag: 'realestatecoaching', count: 0 },
		{ id: 5, title: 'Executive Coaching', tag: 'executivecoaching', count: 0 },
		{ id: 6, title: 'Leadership Coaching', tag: 'leadershipcoaching', count: 0 },
		{ id: 7, title: 'Career Coaching', tag: 'careercoaching', count: 0 },
		{ id: 8, title: 'Job Getting Coaching', tag: 'jobgettingcoaching', count: 0 },
		{ id: 9, title: 'Life Coaching', tag: 'lifecoaching', count: 0 },
		{ id: 10, title: 'Relationship Coaching', tag: 'relationshipcoaching', count: 0 },
		{ id: 11, title: 'Pickup Skills Coaching', tag: 'pickupskillscoaching', count: 0 },
		{ id: 12, title: 'Dating Skills Coaching', tag: 'datingskillscoaching', count: 0 },
		{ id: 13, title: 'Confidence Coaching', tag: 'confidencecoaching', count: 0 },
		{ id: 14, title: 'Communication Skills Coaching', tag: 'communicationskillscoaching', count: 0 },
		{ id: 15, title: 'Parent Coaching', tag: 'parentcoaching', count: 0 },
		{ id: 16, title: 'Sex Coaching', tag: 'sexcoaching', count: 0 },
		{ id: 17, title: 'Teenager Coaching', tag: 'teenagercoaching', count: 0 },
		{ id: 18, title: 'Weight Loss Coaching', tag: 'weightlosscoaching', count: 0 },
		{ id: 19, title: 'Fitness Coaching', tag: 'fitnesscoaching', count: 0 },
		{ id: 20, title: 'Beauty Coaching', tag: 'beautycoaching', count: 0 },
		{ id: 21, title: 'Health Coaching', tag: 'healthcoaching', count: 0 },
		{ id: 22, title: 'Sport Coaching', tag: 'sportcoaching', count: 0 },
		{ id: 23, title: 'Nutrition Coaching', tag: 'nutritioncoaching', count: 0 },
		{ id: 24, title: 'Cooking Coaching', tag: 'cookingcoaching', count: 0 },
		{ id: 25, title: 'Fashion Coaching', tag: 'fashioncoaching', count: 0 },
		{ id: 26, title: 'Entertainment Coaching', tag: 'entertainmentcoaching', count: 0 },
		{ id: 27, title: 'Photo & Video Coaching', tag: 'photovideocoaching', count: 0 },
		{ id: 28, title: 'Music & Audio Coaching', tag: 'musicaudiocoaching', count: 0 },
		{ id: 29, title: 'Design and Creative Coaching', tag: 'designandcreativecoaching', count: 0 },
		{ id: 30, title: 'Home Design Coaching', tag: 'homedesigncoaching', count: 0 },
		{ id: 31, title: 'Education Coaching', tag: 'educationcoaching', count: 0 },
		{ id: 32, title: 'Learning Coaching', tag: 'learningcoaching', count: 0 },
		{ id: 33, title: 'Tech Coaching', tag: 'techcoaching', count: 0 },
		{ id: 34, title: 'Programming Coaching', tag: 'programmingcoaching', count: 0 },
		{ id: 35, title: 'Auto & Moto Coaching', tag: 'automotocoaching', count: 0 },
		{ id: 36, title: 'Law and Legal Coaching', tag: 'lawandlegalcoaching', count: 0 },
		{ id: 37, title: 'Immigration Coaching', tag: 'immigrationcoaching', count: 0 },
		{ id: 38, title: 'Integration Coaching', tag: 'integrationcoaching', count: 0 },
		{ id: 39, title: 'Culture Coaching', tag: 'culturecoaching', count: 0 },
		{ id: 40, title: 'Travel and Tourist Coaching', tag: 'travelandtouristcoaching', count: 0 },
		{ id: 41, title: 'Spiritual and Fulfillment Coaching', tag: 'spiritualandfulfillmentcoaching', count: 0 },
		{ id: 42, title: 'Collaboration', tag: 'collaboration', count: 0 },
		{ id: 43, title: 'Other', tag: 'other', count: 0 },
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

app.get('/static/getfullcategories', (req, res) => {
    let categories = getCategories();
    res.send(categories)
})

app.get('/static/getfullcategories', (req, res) => {
    let categories = getCategories();
    res.send(categories)
})

app.get('/permarticle/:id', (req, res) => {
    let {id} = req.params

    models.Article.findOneById(id, (err, article) => {
        if (article.sharedFrom) article = article.sharedFrom;

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
app.use('/reviews', require('./routes/reviews'))
app.use('/admin', require('./routes/admin'))
app.use('/rating', require('./routes/rating'))
app.use('/book', require('./routes/book'))
app.use('/dsquanly', require('./routes/dsquanly'))
app.use('/expertcityname',require('./routes/expertcityname'))
app.use('/expertcountryname',require('./routes/expertcountryname'))
app.use('/expertcategoryname',require('./routes/expertcategoryname'))
app.use('/authorname',require('./routes/authorname'))