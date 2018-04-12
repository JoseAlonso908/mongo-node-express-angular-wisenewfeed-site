const 	express = require('express'),
		multer = require('multer'),
		path = require('path'),
		async = require('async'),
		config = require('./../config')

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
	let {title, text, privacy} = req.body

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

	async.waterfall([
		(next) => {
			models.Image.createBunch(req.user._id, filenames, next)
		},
		(images, next) => {
			models.Article.getFirstLinkMeta(text).then((meta) => {
		        next(null, meta, images)
		    }).catch(next)
		},
		(meta, images, next) => {
            if (text && req.user.role === 'user') text = text.replace(/\$lessonlearned/gi, '')
			models.Article.create({
	            author: req.user._id,
	            country: req.user.country,
	            category: req.user.field,
				title: title,
	            text: text,
	            images,
	            allowhtml: !!title,
				meta,
				privacy
	        }, (err, article) => {
	        	next(err, article)
	        })
		},
		(article, next) => {
			models.ExperienceLog.award(req.user._id, config.EXP_REWARDS.POST.create, article._id, null, 'create', (err, result) => {
				next(null, article)
			})
		},
		//Get mentioned users
		(article, next) => {
			const nicknames = models.Article.getMentionedNicknames(text)
			models.User.getUsersByNicknames(nicknames).then(users => {
                next(null, article, users)
			}).catch(err => {
                console.log('Failed to get mentioned users', err)
                next(null, article, [])
            })
		},
		// Create notifications for mentioned users
		(article, users, next) => {
            async.each(users, (user, cb)=> {
            	//to, from, post, comment, type, callback
                console.log('article._id', article._id);
                models.Notification.create(user._id, req.user._id, article._id, null, 'mentioned', (err, res) => {
                    cb(err)
                })
			}, (err, result) => {
            	return next()
			})
		}
	], (err) => {
		if (err) res.status(400).send(err)
		else res.send({ok: true})
	})
})

router.post('/edit', tempUploads.array('files', 5), (req, res) => {
	let {postId, text} = req.body

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

	models.Article.edit(postId, req.user._id, text, [], (err, article) => {
		if (err) res.status(400).send({message: 'Error updating post'})
		else res.send({ok: true, article})
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

router.get('/one', (req, res) => {
	let {id} = req.query

	models.Article.findOneById(id, (err, article) => {
		if (err) res.status(400).send(err)
		else res.send(article)
	})
})

router.get('/all', (req, res) => {
	let {category, country, filter, start, limit} = req.query

	models.Article.getAll((req.user) ? req.user._id : null, category, country, filter, start, limit, (err, articles) => {
		res.send(articles)
	})
})

router.get('/search', (req, res) => {
	let {q, category, country, filter, start, limit} = req.query

	models.Article.search((req.user) ? req.user._id : null, q, category, country, filter, start, limit, (err, articles) => {
		res.send(articles)
	})
})

router.get('/my', (req, res) => {
	if (req.access_token == 'guest') return res.status(400).send({message: 'Invalid token'})

	models.Article.getByUser(req.user._id, (err, articles) => {
		res.send(articles)
	})
})

router.get('/byuser', (req, res) => {
	let {user, start, limit} = req.query

	models.Article.getByUser(user, req.user._id, start, limit, (err, articles) => {
		res.send(articles)
	})
})

router.get('/friendsfeed', (req, res) => {
	let {category, country, start, limit} = req.query
	let userId = req.query.userId || req.user._id

	let authors = []
	// Include user's articles into feed
	authors.push(userId)

	async.series([
        (cb) => {
            // Add users who you're following
            models.Follow.followingByFollower(userId, null, null, null, (err, following) => {
                for (let user of following) {
                    authors.push(user.following._id)
                }

                console.log(1)
                console.log(authors)

                cb()
            })
        },
		(cb) => {
			models.Friendship.friends(userId, (err, friends) => {
				authors = authors.concat(friends)

                console.log(2)
                console.log(authors)

				cb()
			})
		},
	], (err) => {
        models.Article.getByUsers({
            category,
            authors,
            country,
            start,
            limit,
            viewer: req.user._id,
            shares: [],
            nousers: false,
        }, (err, articles) => {
            if (err) res.status(400).send(err)
            else res.send(articles)
        })
	})
})

router.get('/feed', (req, res) => {
	let {category, country, start, limit} = req.query
	let userId = req.query.userId || req.user._id

	let authors = []
	// if (req.user.role != 'user') {
	// 	// Include user's articles into feed
	// 	authors.push(userId)
	// }

	let shares = []
    country = models.Article.transformToTag(country)
    async.waterfall([
		(cb) => {
			// Add users who you're following
			models.Follow.followingByFollower(userId, null, null, null, (err, following) => {
				for (let user of following) {
					authors.push(user.following._id)
				}

				if (authors.length > 0 && req.user.role != 'user') {
                    authors.push(userId)
				}

				cb()
			})
		},
		(cb) => {
			// TODO: Not needed anymore
			models.PostReaction.getUserShares(userId, (err, userShares) => {
				shares = userShares.map((reaction) => {
					return reaction.post.toString()
				})

				cb()
			})
		},
	], () => {
		models.Article.getByUsers({
            category,
            authors,
            country,
            start,
            limit,
            viewer: req.user._id,
            shares: []
        }, (err, articles) => {
			if (err) res.status(400).send(err)
			else res.send(articles)
		})
	})
})

router.get('/feed/liked', (req, res) => {
	let userId = req.query.user || req.user._id
	let {start, limit} = req.query

	// if (req.access_token == 'guest') return res.status(400).send({message: 'Invalid token'})
	models.Article.getReactedOfUser(userId, req.user._id, 'like', start, limit, (err, articles) => {
		res.send(articles)
	})
})

router.get('/feed/disliked', (req, res) => {
	let userId = req.query.user || req.user._id
	let {start, limit} = req.query

	// if (req.access_token == 'guest') return res.status(400).send({message: 'Invalid token'})
	models.Article.getReactedOfUser(userId, req.user._id, 'dislike', start, limit, (err, articles) => {
	// models.Article.getDislikedOfUser(userId, req.user._id, start, limit, (err, articles) => {
		res.send(articles)
	})
})

router.get('/feed/commented', (req, res) => {
	let userId = req.query.user || req.user._id
	let {start, limit} = req.query

	// if (req.access_token == 'guest') return res.status(400).send({message: 'Invalid token'})
	models.Article.getCommentedOfUser(userId, req.user._id, start, limit, (err, articles) => {
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
    if (req.user.role == 'user') {
        text = text.substr(0, 250)
    }
	let filenames = []

    if (req.user.role === 'user') {
        text = text.replace(/(https?:\/\/)?([\da-z\.-]+)\.([a-z\\.]{2,6})(:\d{2,8})?([\/\w\#?\.-]*)*\/?/gi,'')
	}

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

    // We send notification of this type only once per user
    // (because user can react to post multiple times)
    let receivedNotificationsIds = []

	let commentPost

	async.waterfall([
        (next) => {
            models.Image.createBunch(req.user._id, filenames, next)
        },
		(images, next) => {
            models.Comment.addComment(postId, req.user._id, text, images, (err, post) => {
            	commentPost = post
                next()
            })
		},
		(next) => {
			models.Article.findOneById(postId, (err, post) => {
                next(err, post.author)
			})
		},
		(postAuthor, next) => {
			if (postAuthor.notifications[req.user.role] == false) {
				return next(null, postAuthor)
			}

			// Add comment notification
			models.Notification.create(postAuthor, req.user._id, postId, null, 'comment', () => {
                next(null, postAuthor)
			})
		},
		(postAuthor, next) => {
			// Notify people who like this post about this reaction
			models.PostReaction.getAllByPostOfType(postId, 'like', (err, reactions) => {
				async.eachSeries(reactions, (r, cb) => {
					let recipientId = r.author._id
					if (receivedNotificationsIds.indexOf(recipientId.toString()) > -1) return cb()

					if (!r.author.notifications.liked) {
						return cb()
					}

					models.Notification.create(recipientId, req.user._id, postId, null, 'commentilike', (err) => {
						if (!err) {
							receivedNotificationsIds.push(recipientId.toString())
						}

						cb()
					})
				}, (err) => {
                    next(null, postAuthor)
				})
			})
		},
		(postAuthor, next) => {
			// Notify people who commented this post about this reaction
			models.Comment.getPostComments(postId, (err, comments) => {
				async.eachSeries(comments, (c, cb) => {
					let commenterId = c.author._id
					if (receivedNotificationsIds.indexOf(commenterId.toString()) > -1) return cb()

					if (!c.author.notifications.reacted) {
						return cb()
					}

					models.Notification.create(commenterId, req.user._id, commentPost, null, 'commenticomment', (err) => {
						if (!err) {
							receivedNotificationsIds.push(commenterId.toString())
						}

						cb()
					})
				}, (err) => {
                    next(err, postAuthor)
				})
			})
		},
		(postAuthor, next) => {
			models.ExperienceLog.award(postAuthor, config.EXP_REWARDS.POST.react, commentPost, null, 'comment', () => {
                next()
			})
		},
		(next) => {
			models.ExperienceLog.award(req.user._id, config.EXP_REWARDS.COMMENT.create, commentPost, null, 'comment', () => {
                next()
			})
		},
        (next) => {
            const nicknames = models.Article.getMentionedNicknames(text)
            models.User.getUsersByNicknames(nicknames).then(users => {
                next(null, users)
            }).catch(err => {
                console.log('Failed to get mentioned users', err)
                next(null, [])
            })
        },
        // Create notifications for mentioned users
        (users, next) => {
            async.each(users, (user, cb)=> {
                //to, from, post, comment, type, callback
                models.Notification.create(user._id, req.user._id, postId, null, 'mentionedcomment', (err, res) => {
                    cb(err)
                })
            }, (err, result) => {
                return next()
            })
        }
	], (err) => {
		res.send({ok: true})
	})
})

router.post('/comment/edit', tempUploads.array('files', 5), (req, res) => {
	if (req.access_token == 'guest') return res.status(400).send({message: 'Invalid token'})

	let {commentId, text, remove} = req.body

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

	async.series({
		removeImages: (next) => {
			models.Image.removeBunch(req.user._id, remove, next)
		},
		save: (next) => {
            models.Comment.editComment(commentId, req.user._id, text, [], remove, next)
		}
	}, (err, results) => {
		let comment = results.save
        if (err) res.status(400).send({message: 'Error updating comment'})
        else res.send({ok: true, comment: comment})
	})
})

router.post('/comment/remove', (req, res) => {
	let {commentId} = req.body

	models.Comment.removeComment(req.user._id, commentId, (err, result) => {
		res.send(result)
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

	// We send notification of this type only once per user
	// (because user can react to post multiple times)
	let receivedNotificationsIds = []

	async.waterfall([
		(cb) => {
			models.Article.findOneById(post, (err, post) => {
				cb(err, post.author)
			})
		},
		(postAuthor, cb) => {
			if (postAuthor.notifications[req.user.role] == false) {
				return cb(null, postAuthor)
			}

			models.Notification.create(postAuthor._id, req.user._id, post, null, type, () => {
				cb(null, postAuthor)
			})
		},
		(postAuthor, cb) => {
			// Notify people who like this post about this reaction
			models.PostReaction.getAllByPostOfType(post, 'like', (err, reactions) => {
				async.eachSeries(reactions, (r, cb) => {
					let recipientId = r.author._id
					if (receivedNotificationsIds.indexOf(recipientId.toString()) > -1) return cb()

					if (!r.author.notifications.liked) {
						return cb()
					}

					models.Notification.create(recipientId, req.user._id, post, null, `${type}ilike`, (err) => {
						if (!err) {
							receivedNotificationsIds.push(recipientId.toString())
						}

						cb()
					})
				}, (err) => {
					cb(null, postAuthor)
				})
			})
		},
		(postAuthor, cb) => {
			// Notify people who commented this post about this reaction
			models.Comment.getPostComments(post, (err, comments) => {
				async.eachSeries(comments, (c, cb) => {
					let commenterId = c.author._id
					if (receivedNotificationsIds.indexOf(commenterId.toString()) > -1) return cb()

					if (!c.author.notifications.reacted) {
						return cb()
					}

					models.Notification.create(commenterId, req.user._id, post, null, `${type}icomment`, (err) => {
						if (!err) {
							receivedNotificationsIds.push(commenterId.toString())
						}

						cb()
					})
				}, (err) => {
					cb(null, postAuthor)
				})
			})
		},
		(postAuthor, cb) => {
			if (type != 'dislike') {
				models.ExperienceLog.award(postAuthor, config.EXP_REWARDS.POST[type], post, null, type, cb)
			} else {
				cb()
			}
		},
	], (err) => {
		models.PostReaction.react(req.user._id, post, type, (err, result) => {
			let done = () => {
				if (err) res.status(400).send(err)
				else res.send({ok: true})
			}

			if (type === 'share') {
				models.Article.share(req.user._id, post, done)
			} else done()
		})
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
	let {comment, type} = req.body

	models.CommentReaction.react(req.user._id, comment, type, (err, result) => {
		async.waterfall([
			(cb) => {
				models.Comment.findOneById(comment, (err, comment) => {
					cb(err, comment.author._id)
				})
			},
			(author, cb) => {
				models.Notification.create(author, req.user._id, null, comment, type, (err, result) => {
					cb(err, author)
				})
			},
			(author, cb) => {
				if (type != 'dislike') {
					models.ExperienceLog.award(author, config.EXP_REWARDS.COMMENT[type], null, comment, type, cb)
				} else {
					cb()
				}
			},
		], (err) => {
			if (err) res.status(400).send(err)
			else res.send({ok: true})
		})
	})
})

router.delete('/comment/react', (req, res) => {
	let {comment, type} = req.query

	models.CommentReaction.unreact(req.user._id, comment, type, (err, result) => {
		res.send({ok: true})
	})
})

router.get('/pieces', (req, res) => {
	models.Piece.getTopGrouped((err, result) => {
		res.send(result)
	})
})

router.get('/pieces/search', (req, res) => {
	let {query} = req.query

	models.Piece.search(query, {user: req.user._id}, (err, result) => {
        res.send(result)
	})
})

router.post('/hide', (req, res) => {
	let {article} = req.body

	models.HiddenArticle.hide(article, req.user._id, (err, result) => {
		if (err) res.status(400).send(err)
		else res.send({ok: true})
	})
})

router.post('/unhide', (req, res) => {
	let {article} = req.body

	models.HiddenArticle.unhide(article, req.user._id, (err, result) => {
		if (err) res.status(400).send(err)
		else res.send({ok: true})
	})
})

router.post('/mute', (req, res) => {
	let {author} = req.body

	models.MutedAuthor.mute(author, req.user._id, (err, result) => {
		if (err) res.status(400).send(err)
		else res.send({ok: true})
	})
})

router.post('/unmute', (req, res) => {
	let {author} = req.body

	models.MutedAuthor.unmute(author, req.user._id, (err, result) => {
		if (err) res.status(400).send(err)
		else res.send({ok: true})
	})
})

module.exports = router
