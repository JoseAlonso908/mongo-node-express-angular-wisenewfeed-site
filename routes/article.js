const 	express = require('express'),
		multer = require('multer'),
		path = require('path')

let tempUploads = multer({dest: 'temp/'})
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

router.post('/create', tempUploads.array('files', 5), (req, res) => {
	let {text} = req.body

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
	}

	models.Article.create(req.user._id, text, filenames, () => {
		res.send({ok: true})
	})
})

router.get('/all', (req, res) => {
	models.Article.getAll((err, articles) => {
		res.send(articles)
	})
})

router.get('/my', (req, res) => {
	if (req.access_token == 'guest') return res.status(400).send({message: 'Invalid token'})

	models.Article.getByUser(req.user._id, (err, articles) => {
		res.send(articles)
	})
})

router.get('/comment/get', (req, res) => {
	let {postId} = req.query

	models.Comment.getPostComments(postId, (err, comments) => {
		res.send(comments)
	})
})

router.post('/comment/add', tempUploads.array('files', 5), (req, res) => {
	if (req.access_token == 'guest') return res.status(400).send({message: 'Invalid token'})
	
	let {postId, text} = req.body

	console.log('qweqwe')
	console.log(req.body)
	console.log(req.files)

	let filenames = []

	if (req.files && req.files.length > 0) {
		const fs = require('fs')

		for (let file of req.files) {
			let filename = file.filename,
				extension = file.originalname.split('.').slice(-1),
				tempPath = file.path,
				newFilename = file.filename + '.' + extension

			fs.renameSync(path.join(__root, tempPath), path.join(__root, 'uploads', 'comments', newFilename))
			
			filenames.push(path.join('uploads', 'comments', newFilename))
		}
	}

	models.Comment.addComment(postId, req.user._id, text, filenames, (err, post) => {
		res.send({ok: true})
	})
})

router.get('/reactions', (req, res) => {
	let {post} = req.query

	models.PostReaction.getByPost(req.user._id, post, (err, reactions) => {
		res.send(reactions)
	})
})

router.post('/react', (req, res) => {
	let {post, type} = req.body

	models.PostReaction.react(req.user._id, post, type, (err, result) => {
		res.send({ok: true})
	})
})

router.delete('/react', (req, res) => {
	let {post, type} = req.query

	console.log('-' + type)

	models.PostReaction.unreact(req.user._id, post, type, (err, result) => {
		res.send({ok: true})
	})
})

module.exports = router