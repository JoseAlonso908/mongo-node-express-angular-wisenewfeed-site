const 	express = require('express'),
		path = require('path'),
		async = require('async')

let router = express.Router()

router.use((req, res, next) => {
	if (!req.headers.authorization) {
		res.status(400).send({message: 'Invalid token'})
	} else {
		req.access_token = req.headers.authorization.split(' ')[1]

		models.Token.getUserByToken(req.access_token, (err, user) => {
			req.user = user
			next()
		})
	}
})

router.get('/get', (req, res) => {
	models.Notification.getForUserLean(req.user._id, (err, notifications) => {
		if (err) res.status(400).send(err)
		else res.send(notifications)
	})
})

module.exports = router