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

router.get('/conversations', (req, res) => {
	models.Message.getConversations(req.user._id, (err, result) => {
		if (err) return res.status(400).send(err)
		else res.send(result)
	})
})

router.get('/conversation', (req, res) => {
	let {user, skip, limit} = req.query

	models.Message.getConversation(req.user._id, user, skip, limit, (err, result) => {
		if (err) return res.status(400).send(err)
		else res.send(result)
	})
})

router.post('/send', (req, res) => {
	let {to, text} = req.body

	models.Message.send(req.user._id, to, text, (err, result) => {
		if (err) return res.status(400).send(err)
		else {
			events.emit('message', result)
			res.send(result)
		}
	})
})

router.post('/setread', (req, res) => {
	let {ids} = req.body

	ids = ids.map(MOI)

	models.Message.setRead(req.user._id, ids, (err, result) => {
		if (err) return res.status(400).send(err)
		else res.send(result)
	})
})

module.exports = router