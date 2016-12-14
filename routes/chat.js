const 	express = require('express'),
		path = require('path'),
		async = require('async'),
		multer = require('multer')

let tempUploads = multer({dest: 'temp/'})
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

router.post('/send', tempUploads.array('files', 5), (req, res) => {
	let {to, text} = req.body

	let filenames = []

	console.log(req.files)

	if (req.files && req.files.length > 0) {
		const fs = require('fs')

		for (let file of req.files) {
			let filename = file.filename,
				extension = file.originalname.split('.').slice(-1),
				tempPath = file.path,
				newFilename = file.filename + '.' + extension

			fs.renameSync(path.join(__root, tempPath), path.join(__root, 'uploads', 'messages', newFilename))
			
			filenames.push(path.join('uploads', 'messages', newFilename))
		}
	}

	models.Message.send(req.user._id, to, text, filenames, (err, result) => {
		if (err) return res.status(400).send(err)
		else {
			events.emit('message', result)
			res.send(result)
		}
	})
})

router.post('/setread', (req, res) => {
	let {ids} = req.body

	models.Message.setRead(req.user._id, ids, (err, result) => {
		if (err) return res.status(400).send(err)
		else res.send(result)
	})
})

router.post('/hide', (req, res) => {
	let {ids} = req.body

	models.Message.hideMessages(req.user._id, ids, (err, result) => {
		if (err) return res.status(400).send(err)
		else res.send(result)
	})
})

module.exports = router