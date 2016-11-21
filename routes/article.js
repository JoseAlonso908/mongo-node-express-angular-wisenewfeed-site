const 	express = require('express'),
		multer = require('multer'),
		path = require('path'),
		async = require('async')

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

	models.Article.create(req.user._id, req.user.country, req.user.field, text, filenames, () => {
		res.send({ok: true})
	})
})

router.post('/remove', (req, res) => {
	if (req.access_token == 'guest') return res.status(400).send({message: 'Invalid token'})

	let {article} = req.body

	models.Article.remove(req.user._id, article, (err, result) => {
		if (!err) return res.send({ok: true})
		else res.status(400).send(err)
	})
})

router.get('/all', (req, res) => {
	let {category, country, start, limit} = req.query

	models.Article.getAll(category, country, start, limit, (err, articles) => {
		res.send(articles)
	})
})

router.get('/my', (req, res) => {
	if (req.access_token == 'guest') return res.status(400).send({message: 'Invalid token'})

	models.Article.getByUser(req.user._id, (err, articles) => {
		res.send(articles)
	})
})

router.get('/feed', (req, res) => {
	let {category, country, start, limit} = req.query
	let userId = req.query.userId || req.user._id

	let authors = []
	authors.push(userId)

	let shares = []

	async.waterfall([
		(cb) => {
			models.Follow.followingByFollower(userId, (err, following) => {
				for (let user of following) {
					authors.push(user.following._id)
				}

				cb()
			})
		},
		(cb) => {
			models.PostReaction.getUserShares(userId, (err, userShares) => {
				shares = userShares.map((reaction) => {
					return reaction.post.toString()
				})

				cb()
			})
		},
	], () => {
		models.Article.getByUsers(authors, shares, category, country, start, limit, (err, articles) => {
			if (err) res.status(400).send(err)
			else {
				// articles = articles.map((article) => {
				// 	article = article.toObject()

				// 	if (shares.indexOf(article._id.toString()) > -1) {
				// 		article.shared = true
				// 	}

				// 	return article
				// })

				res.send(articles)
			}
		})
	})

	// Add posts of guys who you follow
	models.Follow.followingByFollower(userId, (err, following) => {
		for (let user of following) {
			authors.push(user.following._id)
		}

		
	})
})

router.get('/feed/liked', (req, res) => {
	if (req.access_token == 'guest') return res.status(400).send({message: 'Invalid token'})
	models.Article.getLikedOfUser(req.user._id, (err, articles) => {
		res.send(articles)
	})
})

router.get('/feed/disliked', (req, res) => {
	if (req.access_token == 'guest') return res.status(400).send({message: 'Invalid token'})
	models.Article.getDislikedOfUser(req.user._id, (err, articles) => {
		res.send(articles)
	})
})

router.get('/feed/commented', (req, res) => {
	if (req.access_token == 'guest') return res.status(400).send({message: 'Invalid token'})
	models.Article.getCommentedOfUser(req.user._id, (err, articles) => {
		res.send(articles)
	})
})

router.get('/comment/get/few', (req, res) => {
	let {postIds} = req.query,
		postIdsArray = postIds.split(',')

	models.Comment.getPostsComments(postIdsArray, (err, comments) => {
		res.send(comments)
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

router.get('/reactions/few', (req, res) => {
	let {postIds} = req.query,
		postIdsArray = postIds.split(',')

	models.PostReaction.getByPostIds(req.user._id, postIdsArray, (err, reactions) => {
		res.send(reactions)
	})
})

router.post('/react', (req, res) => {
	let {post, type} = req.body

	models.PostReaction.react(req.user._id, post, type, (err, result) => {
		let done = () => {
			res.send({ok: true})
		}

		if (type === 'share') {
			models.Article.share(req.user._id, post, done)
		} else done()
	})
})

router.delete('/react', (req, res) => {
	let {post, type} = req.query

	models.PostReaction.unreact(req.user._id, post, type, (err, result) => {
		let done = () => {
			res.send({ok: true})
		}

		if (type === 'share') {
			models.Article.unshare(req.user._id, post, done)
		} else done()
	})
})

router.get('/comment/reactions/few', (req, res) => {
	let {commentIds} = req.query,
		commentIdsArray = commentIds.split(',')

	models.CommentReaction.getByCommentIds(req.user._id, commentIdsArray, (err, reactions) => {
		res.send(reactions)
	})
})

router.post('/comment/react', (req, res) => {
	let {post, type} = req.body

	models.CommentReaction.react(req.user._id, post, type, (err, result) => {
		res.send({ok: true})
	})
})

router.delete('/comment/react', (req, res) => {
	let {post, type} = req.query

	models.CommentReaction.unreact(req.user._id, post, type, (err, result) => {
		res.send({ok: true})
	})
})

router.get('/pieces', (req, res) => {
	models.Piece.getTopGrouped((result) => {
		res.send(result)
	})
})

module.exports = router