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
			if (err || !user) res.status(400).send({message: 'User not found'})
			else {
				req.user = user
				next()
			}
		})
	}
})

router.get('/get', (req, res) => {
	async.waterfall([
		(cb) => {
			models.User.findById(req.user._id, cb)
		},
		(user, cb) => {
			models.Notification.getForUser(req.user._id, user.notifications, cb, true)
		},
	], (err, notifications) => {
		if (err) res.status(400).send(err)
		else res.send(notifications)
	})
})

router.post('/setreadm', (req, res) => {
	let nIds = req.body.nIds.split(',')

	async.waterfall([
		(cb) => {
			models.User.findById(req.user._id, cb)
		},
		(user, cb) => {
			models.Notification.setReadForUser(nIds, req.user._id, cb)
		},
	], (err) => {
		if (err) res.status(400).send(err)
		else res.send({ok: true})
	})
})

module.exports = router