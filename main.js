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
    let { url } = req.query;
    request.get(url).pipe(res);
})

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.use((req, res, next) => {
    // res.set('Cache-Control', 'max-age=3')
    next()
})

global.models = require('./model')(config.MONGO[env].DSN, __dirname).models()

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.htm'))
})

app.get('/googleec79aee7f6c7529f.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'googleec79aee7f6c7529f.html'))
})

app.get('/robots.txt', (req, res) => {
    res.sendFile(path.join(__dirname, 'robots.txt'))
})

app.get('/sitemap.xml', (req, res) => {
    res.set('Content-Type', 'application/xml');
    models.User.findAll((err, users) => {
        let length = Math.floor(users.length / 10000);
        if (users.length % 10000 != 0) length++;
        let body = '<?xml version="1.0" encoding="UTF-8"?>';
        body += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
        for (let i = 0; i < length; i++) {
            body += '<sitemap>';
            body += '<loc>https://sandboxapp.wisenewsfeed.com/sitemap-' + (i + 1) + '.xml</loc>';
            body += '</sitemap>';
        }
        body += '</sitemapindex>';
        res.send(body);
    });
})

app.get('/sitemap-:page.xml', (req, res) => {
    res.set('Content-Type', 'application/xml');
    let page = req.params.page;
    models.User.findByPage(page - 1, 10000, (err, users) => {
        let body = '<?xml version="1.0" encoding="UTF-8"?>';
        body += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
        for (let index in users) {
            body += '<url>';
            body += '<loc>https://sandboxapp.wisenewsfeed.com/#!/person/' + users[index]._id + '</loc>';
            body += '</url>';
        }
        body += '</urlset>';
        res.send(body);
    });
})

let getCountries = () => {
    return JSON.parse(JSON.stringify(countriesList))
}

app.get('/static/countries/grouped', (req, res) => {
    let result = []
    let countriesList = getCountries()
    console.log('country', countriesList);

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
        res.status(500).json({ ok: false })
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

global.getCategories = (coach) => {
    return (coach == 1) ?
        [
            { id: 0, title: 'All', tag: 'all', count: 0 },
            { id: 1, title: 'Startup Coaching', tag: 'startupcoaching', count: 0 },
            { id: 2, title: 'Business Coaching', tag: 'businesscoaching', count: 0 },
            { id: 3, title: 'Life Coaching', tag: 'lifecoaching', count: 0 },
            { id: 4, title: 'Career Coaching', tag: 'careercoaching', count: 0 },
            { id: 5, title: 'Learning Coaching', tag: 'learningcoaching', count: 0 },
            { id: 6, title: 'Health Coaching', tag: 'healthcoaching', count: 0 },
            { id: 7, title: 'Immigrant Coaching', tag: 'immigrantcoaching', count: 0 },
            { id: 8, title: 'Other', tag: 'other', count: 0 },

        ] :
        [
            { id: 0, title: 'All', tag: 'all', count: 0 },
            { id: 1, title: 'Consulting', tag: 'consulting', count: 0 },
            { id: 2, title: 'Accounting', tag: 'accounting', count: 0 },
            { id: 3, title: 'Legal', tag: 'legal', count: 0 },
            { id: 4, title: 'Technology', tag: 'technology', count: 0 },
            { id: 5, title: 'Engeneering', tag: 'engeneering', count: 0 },
            { id: 6, title: 'Recruiting', tag: 'recruiting', count: 0 },
            { id: 7, title: 'Real Estate', tag: 'real', count: 0 },
            { id: 8, title: 'Other', tag: 'other', count: 0 },
        ]
}


// TODO: move this to cron
app.get('/static/categories', (req, res) => {

    let country = req.query.country
    let coach = req.query.coach
    let categories = getCategories(coach)
    

    // models.Article.getByUsers([], null, [], null, country, null, null, (err, articles) => {
    models.Article.getByUsers({ authors: [], viewer: null, shares: [], category: null, country }, (err, articles) => {
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
        console.log(categories)
        res.send(categories)
    })
})

app.get('/static/getfullcategories', (req, res) => {
    let categories = getCategories(req.query.coach);

    res.send(categories)
})


app.get('/permarticle/:id', (req, res) => {
    let { id } = req.params

    models.Article.findOneById(id, (err, article) => {
        if (article.sharedFrom) article = article.sharedFrom;

        article.text = article.text
            .replace(/<.+?>/gi, '')
            .replace('&amp;', '&')
            .replace('&nbsp;', ' ')

        // res.send(article)
        res.render('article', { article })
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
app.use('/expertcityname', require('./routes/expertcityname'))
app.use('/expertcountryname', require('./routes/expertcountryname'))
app.use('/expertcategoryname', require('./routes/expertcategoryname'))
app.use('/authorname', require('./routes/authorname'))
app.use('/availability', require('./routes/availability'))
app.use('/seo', require('./routes/seo'))
