const config = require('./config')

const
	express = require('express'),
	path = require('path'),
	bodyParser = require('body-parser'),
	request = require('request')

let app = express()

app.use('/assets', express.static(path.join(__dirname, 'assets')))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

var mongoose = require('mongoose')
mongoose.connect('mongodb://localhost/expertreaction');
var User = require('./models/user')(mongoose)
var Token = require('./models/token')(mongoose)

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'index.htm'))
})

app.get('/me', (req, res) => {
	let token = req.headers.authorization.split(' ')[1]

	if (!token) return res.status(500).send({error: 'Token is not available'})

	Token.getUserByToken(token, (err, user) => {
		res.send(user)
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

			User.findByFacebook(profile.id, (err, user) => {
				let getTokenAndRespond = (user) => {
					Token.createToken(user._id, (err, token) => {
						res.send({token: token.token})
					})
				}

				if (user) getTokenAndRespond(user)
				else {
					User.createUser({
						facebook: profile.id,
						avatar: `https://graph.facebook.com/${profile.id}/picture?type=large`,
						name: profile.name,
					}, (err, user) => {
						console.log(2)
						console.log(user)
						getTokenAndRespond(user)
					})
				}
			})
		})
	})
})

app.listen(8006, () => {
	console.log('kek')
})
