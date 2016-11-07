const 	express = require('express'),
		multer = require('multer')

let tempUploads = multer({dest: 'temp/'})
let router = express.Router()

router.post('/create', tempUploads.array('images', 5), (req, res) => {
	let {text} = req.body
	let token = req.headers.authorization

	models.Token.getUserByToken(token, (err, user) => {
		if (user) {
			models.Article.create(user._id, text, [], () => {
				res.send({ok: true})
			})
		} else res.status(400).send({message: 'Invalid token'})
	})
})

router.get('/my', (req, res) => {
	let token = req.headers.authorization

	models.Token.getUserByToken(token, (err, user) => {
		if (user) {
			models.Article.getByUser(user._id, (err, articles) => {
				res.send(articles)
			})
		} else res.status(400).send({message: 'Invalid token'})
	})
})

module.exports = router