const 	express = require('express'),
		multer = require('multer'),
		async = require('async'),
		path = require('path'),
		fs = require('fs')

const config = require('./../config')

//TODO: possibly wrong tmp dir used (not in project folder)...
let tempUploads = multer({
	dest: '../temp/',
	limits: {
		fileSize: 5 * 1024 * 1024
	}
})

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

router.post('/add', tempUploads.array('files', 5), (req, res) => {
	let filenames = []

	if (req.files && req.files.length > 0) {
		const fs = require('fs')

		for (let file of req.files) {
			let filename = file.filename,
				extension = file.originalname.split('.').slice(-1),
				tempPath = file.path,
				newFilename = file.filename + '.' + extension

			fs.renameSync(path.join(__root, tempPath), path.join(__root, 'uploads', 'posts', newFilename))

			filenames.push(path.join('uploads', 'posts', newFilename))
		}

		models.Image.createBunch(req.user._id, filenames, 'private', (err, result) => {
			// console.log(images)
			if (err) res.status(400).send(err)
			else res.send(result)
		})
	}
})

router.delete('/remove', (req, res) => {
	let {id} = req.query

	models.Image.remove(req.user._id, id, (err, result) => {
		if (err) res.status(400).send(err)
		else res.send(result)
	})
})

router.post('/setprivacy', (req, res) => {
	let {id, privacy} = req.body

	models.Image.setPrivacy(req.user._id, id, privacy, (err, result) => {
		if (err) res.status(400).send(err)
		else res.send(result)
	})
})

module.exports = router