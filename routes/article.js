const 	express = require('express'),
		multer = require('multer')

let tempUploads = multer({dest: 'temp/'})
let router = express.Router()

router.use((req, res, next) => {
	if (!req.headers.authorization) {
		res.status(400).send({message: 'Invalid token'})
	} else {
		req.access_token = req.headers.authorization.split(' ')[1]

		models.Token.getUserByToken(req.access_token, (err, user) => {
			if (user) {
				req.user = user
				next()
			} else res.status(400).send({message: 'Invalid token'})
		})
	}
})

router.post('/create', tempUploads.array('images', 5), (req, res) => {
	let {text} = req.body

	models.Article.create(req.user._id, text, [], () => {
		res.send({ok: true})
	})
})

router.get('/my', (req, res) => {
	models.Article.getByUser(req.user._id, (err, articles) => {
		res.send(articles)
	})
})

router.post('/comment/get', (req, res) => {
	let {postId} = req.body
})

router.post('/comment/add', (req, res) => {
	let {postId, text} = req.body

	models.Comment.addComment(postId, req.user._id, text, (err, post) => {
		res.send({ok: true})
	})
})

module.exports = router