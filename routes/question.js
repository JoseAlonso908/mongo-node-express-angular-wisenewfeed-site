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

router.post('/create', (req, res) => {
	let {recipient, text} = req.body

	let user = req.user._id

	models.Question.create(user, recipient, text, (err, result) => {
		if (err) res.status(400).send(err)
		else res.send({ok: true})
	})
})

router.post('/settype', (req, res) => {
	let {question, type} = req.body

	models.Question.setQuestionType(question, req.user._id, type, (err, result) => {
		if (err) res.status(400).send(err)
		else res.send({ok: true})
	})
})

router.get('/all', (req, res) => {
	let {user, skip, limit} = req.query

	user = user || req.user._id

	models.Question.getByRecipient(user, skip, limit, (err, questions) => {
		if (err) res.status(400).send(err)
		else {
			async.map(questions, (q, next) => {
				models.User.setXpInfo(q.author, (err, user) => {
					q.author = user
					next(null, q)
				})
			}, (err, questions) => {
				res.send(questions)
			})
		}
	})
})

router.post('/reply', (req, res) => {
	let {question, text} = req.query

	models.Question.reply(question, text, (err, result) => {
		if (err) res.status(400).send(err)
		else res.send(result)
	})
})

module.exports = router