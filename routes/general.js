const 	express = require('express'),
		twilio = require('twilio'),
		async = require('async'),
		validator = require('validator'),
		request = require('request'),
		qs = require('querystring')

const config = require('./../config')

let router = express.Router()

let twilioClient = twilio(config.TWILIO.TEST.SID, config.TWILIO.TEST.AUTHTOKEN)

router.get('/me', (req, res) => {
	if (!req.headers.authorization) return res.status(500).send({message: 'Token is not available'})
	let token = req.headers.authorization.split(' ')[1]

	let result = {}

	async.waterfall([
		(callback) => {
			models.Token.getUserByToken(token, (err, user) => {
				if (user) {
					result = user.toObject()
					callback(null, user._id)
				} else return res.status(400).send({message: 'User not found'})
			})
		},
		(id, callback) => {
			models.User.doesHavePassword(id, (err, flag) => {
				result.havePassword = flag
				callback(null, id)
			})
		},
		(id, callback) => {
			models.User.getReactionsOnUser(id, (reactions) => {
				result.reactions = reactions

				result.likes_percentage = 0
				if (reactions.likes > 0 || reactions.dislikes > 0) {
					result.likes_percentage = parseInt((reactions.likes / (reactions.likes + reactions.dislikes)) * 100)
				}

				callback(null, id)
			})
		},
		(id, callback) => {
			models.Question.getByRecipientOfType(id, 'active', null, null, (err, questions) => {
				result.active_questions = questions.length
				callback()
			})
		}
	], (err) => {
		res.send(result)
	})
})

router.get('/user', (req, res) => {
	let {id} = req.query

	let result = {}

	async.series([
		(callback) => {
			models.User.findById(id, (err, user) => {
				result = user.toObject()
				callback()
			})
		},
		(callback) => {
			models.User.getReactionsOnUser(id, (reactions) => {
				result.reactions = reactions

				result.likes_percentage = 0
				if (reactions.likes > 0 || reactions.dislikes > 0) {
					result.likes_percentage = parseInt((reactions.likes / (reactions.likes + reactions.dislikes)) * 100)
				}
				
				callback()
			})
		},
		(callback) => {
			models.Question.getByRecipientOfType(id, 'active', null, null, (err, questions) => {
				result.active_questions = questions.length
				callback()
			})
		}
	], (err) => {
		res.send(result)
	})
})

let getTokenAndRespond = (res, user) => {
	models.Token.createToken(user._id, (err, token) => {
		res.send({token: token.token})
	})
}

router.post('/auth/login', (req, res) => {
	let {email, password} = req.body
	// console.log(`Email: ${email}, password: ${password}`)
	models.User.getByCredentials(email, password, (err, user) => {
		if (!user) return res.status(400).send({message: `No user with this credentials`})
		else {
			getTokenAndRespond(res, user)
		}
	})
})

router.post('/auth/signup/validate/email', (req, res) => {
	let {email} = req.body

	async.series([
		(callback) => {
			if (!validator.isEmail(email)) callback({message: 'Invalid email'})
			else callback()
		},
		(callback) => {
			models.User.findByEmail(email, (err, user) => {
				if (user) callback({message: 'User with this email aready exist'})
				else callback()
			})
		},
	], (err) => {
		if (err) return res.status(400).send(err)
		else return res.send({ok: true})
	})
})

router.post('/auth/signup/validate/phone', (req, res) => {
	let {phone} = req.body

	async.series([
		(callback) => {
			models.User.findByPhone(phone, (err, user) => {
				if (user) callback({message: 'User with this phone aready exist'})
				else callback()
			})
		}
	], (err) => {
		if (err) return res.status(400).send(err)
		else return res.send({ok: true})
	})
})

router.post('/auth/signup/verify/phone', (req, res) => {
	let {phone} = req.body

	models.PhoneVerification.createCode(phone, (err, result) => {
		twilioClient.messages.create({
			to: phone,
			from: '+18443256002',
			body: `Expert Reaction verification code: ${result.code}`
		}, (err, message) => {
			if (err) return res.status(err.status).send(err)
			else return res.send({ok: true})
		})
	})
})

router.post('/auth/signup/verifycode/phone', (req, res) => {
	let {phone, code} = req.body

	models.PhoneVerification.verifyCode(phone, code, (result) => {
		if (result === true) return res.send({ok: true})
		else return res.status(400).send({message: 'Code is invalid'})
	})
})

router.post('/auth/forgotpassword', (req, res) => {
	let {email} = req.body

	models.User.findByEmail(email, (err, user) => {
		if (!user) res.status(400).send({message: 'User with this email does not exist'})
		else {
			models.ResetPassword.createRequest(email, (err, request) => {
				mailgun.sendText(`service@${config.MAILGUN.SANDBOX_DOMAIN}`, email,
				`Password recovery`,
				`You requested a password reset. Please follow this link to proceed:
http://expertreaction.wlab.tech/#!/resetpassword/?token=${request.token}`)
				res.send({ok: true})
			})
		}
	})
})

router.post('/auth/forgotpassword/validate', (req, res) => {
	let {token} = req.body

	models.ResetPassword.validateRequest(token, (result) => {
		if (result) return res.send({ok: true})
		else return res.status(400).send({message: 'Reset password token is invalid'})
	})
})

router.post('/auth/resetpassword', (req, res) => {
	let {token, newpassword} = req.body

	async.waterfall([
		(next) => {
			models.ResetPassword.getEmailByToken(token, (email) => {
				if (!email) return next({message: `Token is invalid`})
				else next(null, email)
			})
		},
		(email, next) => {
			models.User.findByEmail(email, (err, user) => {
				if (!user) return next({message: `User does not exist`})
				else next(null, email, user)
			})
		},
		(email, user, next) => {
			models.User.updatePassword(user._id, newpassword, (err, user) => {
				if (!user) return next({message: 'Unable to change password'})
				else return next(null)
			})
		},
		(next) => {
			models.ResetPassword.removeToken(token, next)
		}
	], (err) => {
		if (err) return res.status(400).send(err)
		else return res.send({ok: true})
	})
})

router.post('/auth/findaccount/request', (req, res) => {
	let {value} = req.body

	models.User.findByEmailOrPhone(value, (err, user) => {
		if (!user) return res.status(400).send({message: 'User not found'})

		let foundValue = {}

		if (user.email === value) foundValue.email = value
		else if (user.phone === value) foundValue.phone = value

		models.FindAccount.create(foundValue, (err, findaccount) => {
			if (foundValue.hasOwnProperty('email')) {
				mailgun.sendText(`service@${config.MAILGUN.SANDBOX_DOMAIN}`, value,
				`Account verification code`,
				`Put this code into corresponding input: ${findaccount.code}`)
			}

			if (foundValue.hasOwnProperty('phone')) {
				twilioClient.messages.create({
					to: value,
					from: '+16692316392',
					body: `Expert Reaction verification code: ${findaccount.code}`
				}, (err, message) => {})
			}

			res.send({ok: true})
		})
	})
})

router.post('/auth/findaccount/signin', (req, res) => {
	let {code} = req.body

	models.FindAccount.findByCode(code, (err, findaccount) => {
		if (!findaccount) return res.status(400).send({message: 'Code is invalid'})

		let identityValue = ''
		if (findaccount.email) identityValue = findaccount.email
		else if (findaccount.phone) identityValue = findaccount.phone

		models.User.findByEmailOrPhone(identityValue, (err, user) => {
			getTokenAndRespond(res, user)
		})
	})
})

router.post('/auth/signup', (req, res) => {
	let {email, password, name, country, phone, position, company, field} = req.body

	async.series([
		(callback) => {
			if (!email || !password || !name || !country || !phone)
				callback({message: 'All fields should be filled'})
			else callback()
		},
		(callback) => {
			if (!validator.isEmail(email)) callback({message: 'Invalid email'})
			else callback()
		},
		(callback) => {
			models.User.findByEmail(email, (err, user) => {
				if (user) callback({message: 'User with this email aready exist'})
				else callback()
			})
		},
		(callback) => {
			models.User.findByPhone(phone, (err, user) => {
				if (user) callback({message: 'User with this phone aready exist'})
				else callback()
			})
		},
	], (err, results) => {
		if (err) return res.status(400).send(err)
		else {
			models.User.createUser(req.body, (err, user) => {
				getTokenAndRespond(res, user)
			})
		}
	})
})

router.post('/auth/facebook', (req, res) => {
	let {updateExisting} = req.body

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

			models.User.findOne({facebook: profile.id}, (err, user) => {
				if (user) {
					if (updateExisting) {
						return res.status(400).send({message: 'This account is already taken. Contact us to request details.'})
					} else {
						getTokenAndRespond(res, user)
					}
				} else {
					if (updateExisting) {
						models.User.update(updateExisting, {
							facebook: profile.id,
							facebookName: profile.name,
						}, (err, user) => {
							res.send(user)
						})
					} else {
						models.User.createUser({
							facebook: profile.id,
							facebookName: profile.name,
							avatar: `https://graph.facebook.com/${profile.id}/picture?type=large`,
							name: profile.name,
						}, (err, user) => {
							getTokenAndRespond(res, user)
						})
					}
				}
			})
		})
	})
})

router.post('/auth/linkedin', function(req, res) {
	let {updateExisting} = req.body

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
			models.User.findOne({linkedin: profile.id}, (err, user) => {
				if (user) {
					if (updateExisting) {
						return res.status(400).send({message: 'This account is already taken. Contact us to request details.'})
					} else {
						getTokenAndRespond(res, user)
					}
				} else {
					if (updateExisting) {
						models.User.update(updateExisting, {
							linkedin: profile.id,
							linkedinName: profile.firstName + ' ' + profile.lastName,
						}, (err, user) => {
							res.send(user)
						})
					} else {
						models.User.createUser({
							linkedin: profile.id,
							linkedinName: profile.firstName + ' ' + profile.lastName,
							avatar: profile.pictureUrl,
							name: profile.firstName + ' ' + profile.lastName,
						}, (err, user) => {
							getTokenAndRespond(res, user)
						})
					}
				}
			})
		})
	})
})

router.post('/auth/twitter', (req, res) => {
	let {updateExisting} = req.body

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
				models.User.findOne({twitter: profile.id}, (err, user) => {
					if (user) {
						if (updateExisting) {
							return res.status(400).send({message: 'This account is already taken. Contact us to request details.'})
						} else {
							getTokenAndRespond(res, user)
						}
					} else {
						if (updateExisting) {
							models.User.update(updateExisting, {
								twitter: profile.id,
								twitterName: profile.name,
							}, (err, user) => {
								res.send(user)
							})
						} else {
							models.User.createUser({
								twitter: profile.id,
								twitterName: profile.name,
								avatar: profile.profile_image_url_https.replace('_normal', ''),
								name: profile.name,
							}, (err, user) => {
								getTokenAndRespond(res, user)
							})
						}
					}
				})
			})
		})
	}
})

module.exports = router