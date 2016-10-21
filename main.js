const config = require('./config')

const
	express = require('express'),
	path = require('path'),
	bodyParser = require('body-parser'),
	request = require('request'),
	qs = require('querystring'),
	validator = require('validator'),
	countriesList = require('countries-list')

let app = express()

app.use('/assets', express.static(path.join(__dirname, 'assets'), {
	setHeaders: function (res, path, stat) {
		res.set('Access-Control-Allow-Origin', '*')
		res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
	}
}))

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

var mongoose = require('mongoose')
mongoose.connect('mongodb://localhost/expertreaction');
var User = require('./models/user')(mongoose)
var Token = require('./models/token')(mongoose)

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'index.htm'))
})

app.get('/static/countries', (req, res) => {
	let countryPhoneCodeList = []

	for (let code in countriesList.countries) {
		let item = countriesList.countries[code]

		countryPhoneCodeList.push(`${item.name} +${item.phone}`)
	}

	res.send(countryPhoneCodeList)
})

app.get('/me', (req, res) => {
	let token = req.headers.authorization.split(' ')[1]

	if (!token) return res.status(500).send({error: 'Token is not available'})

	Token.getUserByToken(token, (err, user) => {
		res.send(user)
	})
})

let getTokenAndRespond = (res, user) => {
	Token.createToken(user._id, (err, token) => {
		res.send({token: token.token})
	})
}

app.post('/auth/login', (req, res) => {
	let {email, password} = req.body
	User.getByCredentials(email, password, (err, user) => {
		if (!user) return res.status(400).send({message: `No user with this credentials`})
		else {
			getTokenAndRespond(res, user)
		}
	})
})

app.post('/auth/signup', (req, res) => {
	let {email, password, name, country, phone} = req.body
	User.findByEmail(email, (err, user) => {
		if (user) return res.status(400).send({message: 'User with this email aready exist'})
		else {
			if (!email || !password || !name || !country || !phone)
				return res.status(400).send({message: 'All fields should be filled'})

			if (!validator.isEmail(email)) return res.status(400).send({message: 'Invalid email'})

			User.createUser({
				email, password, name, country, phone
			}, (err, user) => {
				getTokenAndRespond(res, user)
			})
		}
	})
})

app.post('/auth/facebook', (req, res) => {
	let fields = ['id', 'email', 'first_name', 'last_name', 'link', 'name'];
	let accessTokenUrl = 'https://graph.facebook.com/v2.5/oauth/access_token';
	let graphApiUrl = 'https://graph.facebook.com/v2.5/me?fields=' + fields.join(',');
	let params = {
		code: req.body.code,
		client_id: req.body.clientId,
		client_secret: config.FACEBOOK_SECRET,
		redirect_uri: req.body.redirectUri
	};

	// Step 1. Exchange authorization code for access token.
	request.get({url: accessTokenUrl, qs: params, json: true}, function(err, response, accessToken) {
		if (response.statusCode !== 200) {
			return res.status(500).send({message: accessToken.error.message});
		}

		// Step 2. Retrieve profile information about the current user.
		request.get({url: graphApiUrl, qs: accessToken, json: true}, function(err, response, profile) {
			if (response.statusCode !== 200) {
				return res.status(500).send({message: profile.error.message});
			}

			User.findOne({facebook: profile.id}, (err, user) => {
				if (user) getTokenAndRespond(res, user)
				else {
					User.createUser({
						facebook: profile.id,
						avatar: `https://graph.facebook.com/${profile.id}/picture?type=large`,
						name: profile.name,
					}, (err, user) => {
						getTokenAndRespond(res, user)
					})
				}
			})
		})
	})
})

app.post('/auth/linkedin', function(req, res) {
	var accessTokenUrl = 'https://www.linkedin.com/uas/oauth2/accessToken'
	var peopleApiUrl = 'https://api.linkedin.com/v1/people/~:(id,first-name,last-name,email-address,picture-url)'
	var params = {
		code: req.body.code,
		client_id: req.body.clientId,
		client_secret: config.LINKEDIN_SECRET,
		redirect_uri: req.body.redirectUri,
		grant_type: 'authorization_code'
	}

	// Step 1. Exchange authorization code for access token.
	request.post(accessTokenUrl, { form: params, json: true }, function(err, response, body) {
		if (response.statusCode !== 200) {
			return res.status(response.statusCode).send({ message: body.error_description });
		}
		var params = {
			oauth2_access_token: body.access_token,
			format: 'json'
		};

		// Step 2. Retrieve profile information about the current user.
		request.get({ url: peopleApiUrl, qs: params, json: true }, function(err, response, profile) {
			User.findOne({linkedin: profile.id}, (err, user) => {
				if (user) getTokenAndRespond(res, user)
				else {
					User.createUser({
						twitter: profile.id,
						avatar: profile.pictureUrl,
						name: profile.firstName + ' ' + profile.lastName,
					}, (err, user) => {
						getTokenAndRespond(res, user)
					})
				}
			})
		})
	})
})

app.post('/auth/twitter', function(req, res) {
	var requestTokenUrl = 'https://api.twitter.com/oauth/request_token'
	var accessTokenUrl = 'https://api.twitter.com/oauth/access_token'
	var profileUrl = 'https://api.twitter.com/1.1/account/verify_credentials.json'

	// Part 1 of 2: Initial request from Satellizer.
	if (!req.body.oauth_token || !req.body.oauth_verifier) {
		var requestTokenOauth = {
			consumer_key: config.TWITTER_KEY,
			consumer_secret: config.TWITTER_SECRET,
			callback: req.body.redirectUri
		}

		// Step 1. Obtain request token for the authorization popup.
		request.post({ url: requestTokenUrl, oauth: requestTokenOauth }, function(err, response, body) {
			var oauthToken = qs.parse(body)
			// Step 2. Send OAuth token back to open the authorization screen.
			res.send(oauthToken)
		})
	} else {
		// Part 2 of 2: Second request after Authorize app is clicked.
		var accessTokenOauth = {
			consumer_key: config.TWITTER_KEY,
			consumer_secret: config.TWITTER_SECRET,
			token: req.body.oauth_token,
			verifier: req.body.oauth_verifier
		}

		// Step 3. Exchange oauth token and oauth verifier for access token.
		request.post({ url: accessTokenUrl, oauth: accessTokenOauth }, function(err, response, accessToken) {
			accessToken = qs.parse(accessToken)

			var profileOauth = {
				consumer_key: config.TWITTER_KEY,
				consumer_secret: config.TWITTER_SECRET,
				token: accessToken.oauth_token,
				token_secret: accessToken.oauth_token_secret,
			}

			// Step 4. Retrieve user's profile information and email address.
			request.get({
				url: profileUrl,
				qs: { include_email: true },
				oauth: profileOauth,
				json: true
			}, function(err, response, profile) {

				User.findOne({twitter: profile.id}, (err, user) => {
					if (user) getTokenAndRespond(res, user)
					else {
						User.createUser({
							twitter: profile.id,
							avatar: profile.profile_image_url_https.replace('_normal', ''),
							name: profile.name,
						}, (err, user) => {
							getTokenAndRespond(res, user)
						})
					}
				})
			})
		})
	}
})


app.listen(8006, () => {
	console.log('kek')
})
