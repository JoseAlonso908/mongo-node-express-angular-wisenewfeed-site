const   express = require('express'),
		multer = require('multer'),
		path = require('path'),
		async = require('async'),
		config = require('./../config')

let tempUploads = multer({dest: 'temp/'})
let router = express.Router()

router.get('/person/:id', (req, res) => {
	let id = req.params.id;
	models.User.findById(id, (uerr, user) => {
		models.Article.findArticlesByUser(user._id, (aerr, articles) => {
			res.render('person-seo', { user: user, articles: articles })
		})
	})
})

router.get('/article/:id', (req, res) => {
	let id = req.params.id;
	models.Article.findOneById(id, (err, article) => {
		res.render('article-seo', { article: article })
	})
})

module.exports = router
