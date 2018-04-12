const 	express = require('express'),
		multer = require('multer'),
		async = require('async'),
		path = require('path'),
		fs = require('fs'),
		randomString = require('random-string')

const config = require('./../config')

//TODO: possibly wrong tmp dir used (not in project folder)...
let tempUploads = multer({
	dest: '../temp/',
	limits: {
		fileSize: 5 * 1024 * 1024
	}
})

ws.WSEmitter.on('disconnect', (userId) => {
	models.User.updateLastVisit(userId, () => {})
})

let router = express.Router()

router.use(function (err, req, res, next) {
	if (err.code === 'LIMIT_FILE_SIZE') {
		return res.status(400).send({message: `Can't upload file: ${err.message}`})
	} else {
		next()
	}
})

router.use((req, res, next) => {
	if (['/approve', '/decline', '/upgrade'].indexOf(req.path) > -1) {
		return next()
	}

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

router.get('/familiarexperts', (req, res) => {
	async.waterfall([
		(next) => {
			models.MutedAuthor.getMutedByUser(req.user._id, next)
		},
		(mutedUsers, next) => {
			let mutedUsersIds = mutedUsers.map((user) => {
				return MOI(user._id)
			})

			models.User.getRandomUsers(req.user._id, {
				$and: [{_id: {$nin: mutedUsersIds}}, {_id: {$ne: req.user._id}}],
				role: 'expert'
			}, 3, next)
		},
	], (err, experts) => {
		if (err) res.status(400).send(err)
		else {
			async.mapSeries(experts, (user, next) => {
				models.User.getReactionsOnUser(user._id, (reactions) => {
					user.reactions = reactions

					user.likes_percentage = 0
					if (reactions.likes > 0 || reactions.dislikes > 0) {
						user.likes_percentage = parseInt((reactions.likes / (reactions.likes + reactions.dislikes)) * 100)
					}

					next(null, user)
				})
			}, (err, experts) => {
				res.send(experts)
			})
		}
	})
})

router.post('/profile/edit/avatar', tempUploads.single('file'), (req, res) => {
	let user = req.user

	if (user) {
		let filename = req.file.filename,
			extension = req.file.originalname.split('.').slice(-1),
			tempPath = req.file.path,
			newFilename = req.file.filename + '.' + extension

		if (user.avatar) {
			try {
				fs.unlinkSync(path.join(__root, user.avatar))
			} catch (e) {
				console.log(`Can't remove old avatar:`)
				console.log(e)
			}
		}

		fs.renameSync(path.join(__root, tempPath), path.join(__root, 'uploads', 'avatars', newFilename))

		models.User.setAvatar(user._id, path.join('uploads', 'avatars', newFilename), () => {
			res.send({ok: true})
		})
	} else res.status(400).send({message: 'Invalid token'})
})

router.post('/profile/edit/wallpaper', tempUploads.single('file'), (req, res) => {
	let user = req.user

	if (user) {
		let filename = req.file.filename,
			extension = req.file.originalname.split('.').slice(-1),
			tempPath = req.file.path,
			newFilename = req.file.filename + '.' + extension

		if (user.wallpaper) {
			try {
				fs.unlinkSync(path.join(__root, user.wallpaper))
			} catch (e) {
				console.log(`Can't remove old wallpaper:`)
				console.log(e)
			}
		}

		fs.renameSync(path.join(__root, tempPath), path.join(__root, 'uploads', 'wallpapers', newFilename))

		models.User.setWallpaper(user._id, path.join('uploads', 'wallpapers', newFilename), () => {
			res.send({ok: true})
		})
	} else res.status(400).send({message: 'Invalid token'})
})

router.post('/profile/edit/addcertificate', tempUploads.single('file'), (req, res) => {
	let user = req.user

	if (user) {
		let filename = req.file.filename,
			extension = req.file.originalname.split('.').slice(-1),
			tempPath = req.file.path,
			newFilename = req.file.filename + '.' + extension

		fs.renameSync(path.join(__root, tempPath), path.join(__root, 'uploads', 'certificates', newFilename))

		models.User.addCertificate(user._id, req.file.originalname, path.join('uploads', 'certificates', newFilename), () => {
			res.send({ok: true})
		})
	} else res.status(400).send({message: 'Invalid token'})
})

router.post('/profile/edit/removecertificate', tempUploads.single('file'), (req, res) => {
	let user = req.user
	let {filename} = req.body

	if (user) {
		models.User.getCertificateByName(user._id, filename, (cert) => {
			if (cert) {
				try {
					fs.unlinkSync(path.join(__root, cert.filepath))
				} catch (e) {
					console.log(`Can't unlink file`)
					console.log(e)
				}
				models.User.removeCertificateByName(user._id, filename, () => {
					res.send({ok: true})
				})
			} else {
				res.status(400).send({message: 'Certificate not found'})
			}
		})
	} else res.status(400).send({message: 'Invalid token'})
})

router.post('/profile/edit/adddownload', tempUploads.single('file'), (req, res) => {
	let user = req.user

	if (user) {
		let filename = req.file.filename,
			extension = req.file.originalname.split('.').slice(-1),
			tempPath = req.file.path,
			newFilename = req.file.filename + '.' + extension

		fs.renameSync(path.join(__root, tempPath), path.join(__root, 'uploads', 'downloads', newFilename))

		models.User.addDownload(user._id, req.file.originalname, path.join('uploads', 'downloads', newFilename), () => {
			res.send({ok: true})
		})
	} else res.status(400).send({message: 'Invalid token'})
})

router.post('/profile/edit/removedownload', (req, res) => {
	let user = req.user
	let {token, filename} = req.body

	if (user) {
		models.User.getDownloadByName(user._id, filename, (file) => {
			if (file) {
				try {
					fs.unlinkSync(path.join(__root, file.filepath))
				} catch (e) {
					console.log(`Can't unlink file`)
					console.log(e)
				}
				models.User.removeDownloadByName(user._id, filename, () => {
					res.send({ok: true})
				})
			} else {
				res.status(400).send({message: 'Download not found'})
			}
		})
	} else res.status(400).send({message: 'Invalid token'})
})

router.post('/profile/edit/settings', (req, res) => {
	let user = req.user
	let {nickname, name, email, phone, country, city, gender, field, language} = req.body

	if (user) {
		models.User.updateSettings(user._id, name, email, phone, country, city, gender, field, language, nickname, () => {
			res.send({ok: true})
		})
	} else res.status(400).send({message: 'Invalid token'})
})

router.post('/profile/edit/profile', tempUploads.single('file'), (req, res) => {
	let user = req.user
	let {token, contact, experience, intro, name, title} = req.body

	if (user) {
		models.User.updateProfile(user._id, contact, experience, intro, name, title, () => {
			res.send({ok: true})
		})
	} else res.status(400).send({message: 'Invalid token'})
})

router.post('/profile/settings/isPasswordValid', (req, res) => {
	let user = req.user
	let {password} = req.body

	models.User.isPasswordValid(user._id, password, (valid) => {
		res.send({valid})
	})
})

router.post('/profile/settings/setPassword', (req, res) => {
	let user = req.user
	let {oldPassword, newPassword} = req.body

	models.User.updateOldPassword(user._id, oldPassword, newPassword, (err, result) => {
		if (!err) return res.send({ok: true})
		else return res.status(400).send(err)
	})
})

router.post('/profile/settings/disconnectsocial', (req, res) => {
	let user = req.user
	let {provider} = req.body,
		providerName = `${provider}Name`

	let updates = {}
	updates[provider] = undefined
	updates[providerName] = undefined

	models.User.update(user._id, updates, (err, result) => {
		if (err) return res.status(400).send({message: 'Unable to update user'})
		else return res.send({ok: true})
	})
})

router.post('/profile/settings/notifications', (req, res) => {
	let user = req.user
	let {expert, journalist, liked, reacted} = req.body

	models.User.updateNotificationsSettings(user._id, expert, journalist, liked, reacted, (err, result) => {
		if (err) return res.status(400).send({message: 'Unable to update user'})
		else return res.send({ok: true})
	})
})

router.get('/categories', (req, res) => {
	let user = req.user
	let {country} = req.query

	let categories = getCategories()

	let authors = []

	models.Follow.followingByFollower(user._id, null, null, null, (err, following) => {
		for (let user of following) {
			authors.push(user.following._id)
		}

		if (authors.length > 0) {
			authors.push(user._id)
		}
        // getByUsers: (authors, viewer, shares, category, country, start = 0, limit = 4, callback) => {

		// models.Article.getByUsers(authors, null, [], null, null, null, null, (err, articles) => {
		models.Article.getByUsers({
			authors,
            viewer: null,
			shares: [],
            category: null,
			country: null,
			start: null,
			limit: null
		}, (err, articles) => {
			if (err) res.status(400).send(err)
			else {
				for (let article of articles) {
					if ((country && article.country != country) || !article.author) continue

					for (let category of categories) {
						if ((new RegExp(`\\$${category.tag}`)).test(article.text)) {
							category.count++
						}

						// if (article.category == category.title) {
						// 	category.count++
						// 	break
						// }
					}
				}

				res.send(categories)
			}
		})
	})
})

router.get('/mutedauthors', (req, res) => {
	let user = req.user

	models.MutedAuthor.getMutedByUser(user._id, (err, authors) => {
		if (err) return res.status(400).send(err)
		else return res.send(authors)
	})
})

router.post('/block', (req, res) => {
	let user = req.user,
		blocked = req.body.user

	models.BlockedUser.block(blocked, user._id, (err, result) => {
		if (err) res.status(400).send(err)
		else res.send({ok: true})
	})
})

router.post('/unblock', (req, res) => {
	let user = req.user,
		blocked = req.body.user

	models.BlockedUser.unblock(blocked, user._id, (err, result) => {
		if (err) res.status(400).send(err)
		else res.send({ok: true})
	})
})

router.post('/report', (req, res) => {
	let user = req.user
	let {article} = req.body

    async.parallel({
        report: cb => {
            models.Report.report(article, user._id, (err, result) => cb(err))
        },
        hide: cb => {
            models.HiddenArticle.hide(article, req.user._id, (err, result) => cb(err))
        },
		notify: cb => {
            //TODO: Make sure that req.headers.host and etc is sutable for this case
            mailgun.sendText(`service@${config.MAILGUN.SANDBOX_DOMAIN}`, config.ADMIN_EMAILS,
                `ER: Article reported`,
                `Article ${req.protocol}://${req.headers.host}/#!/article/${article} has been reported by ${user.name}(${user.email})`,
                err => cb(err)
            )
		}
    }, (err, result) => {
        if (err) res.status(400).send(err)
        else res.send({ok: true})
    })

})

router.get('/images', (req, res) => {
	let {user} = req.query

	models.Image.imagesOfUser(user, req.user._id, (err, result) => {
		if (err) res.status(400).send(err)
		else res.send(result)
	})
})

router.get('/multisearch', (req, res) => {
	let user = req.user
	let {q} = req.query

	q = decodeURIComponent(q)

	async.parallel({
		categories: (next) => {
			let _q = q

			if (_q[0] == '#') return next()
			else if (_q[0] == '$') _q = _q.substr(1)

			models.Article.searchForTags(user, '$', _q, 5, next)
		},
		countries: (next) => {
            let _q = q
            if (_q[0] == '!') _q = _q.substr(1)
            else return next()
            models.Article.searchForTags(user, '!', _q, 5, next)
		},
        nicknames: (next) => {
            let _q = q
            if (_q[0] == '@') _q = _q.substr(1)
            else return next()

            models.User.search(user, _q, null, 0, 5, true, next)
        },
		tags: (next) => {
			let _q = q

			if (_q[0] == '$') return next()
			else if (_q[0] == '#') _q = _q.substr(1)

			models.Article.searchForTags(user, '#', _q, 5, next)
		},
		users: (next) => {
			models.User.search(user, q, null, 0, 5, false, next)
		},
	}, (err, results) => {
		if (err) res.status(400).send(err)
		else res.send(results)
	})
})

router.get('/searchusers', (req, res) => {
	let {q, role, start, limit} = req.query

	models.User.search(req.user._id, q, role, start, limit, false, (err, results) => {
		if (err) res.status(400).send(err)
		else res.send(results)
	})
})

router.post('/invite/twitter', (req, res) => {
	const Twitter = require('twitter')

	let client = new Twitter({
		consumer_key: config.TWITTER_KEY,
		consumer_secret: config.TWITTER_SECRET,
		access_token_key: config.TWITTER_TOKEN_KEY,
		access_token_secret: config.TWITTER_TOKEN_SECRET,
	})

	client.get('friends/list', (error, list, response) => {
		let twitterIds = list.users.map((u) => {
			return u.id
		})

		// return res.send(list)

		models.User.findByQuery({twitter: {$in: twitterIds}}, (err, users) => {
			if (err) res.status(400).send(err)
			else res.send(users)
		})
	})
})

router.get('/isonline', (req, res) => {
	let {user} = req.query

	res.send(ws.isOnline(user))
})

router.get('/approve', (req, res) => {
	let {id} = req.query
    let password = randomString({length: 8}).toUpperCase()

	console.log(id)

	models.User.updatePassword(id, password, (err, user) => {
        mailgun.sendText(`service@${config.MAILGUN.SANDBOX_DOMAIN}`, [user.email],
            `Your WNF profile was approved!`,
            `Congratulations! Your WiseNewsFeed profile was approved!\n
User ${user.email} and ${password} to access ${req.protocol}://${req.headers.host}/`,
            err => res.send(err)
        )
	})
})

router.get('/decline', (req, res) => {
	let {id} = req.query

	models.User.findById(id, (err, user) => {
		if (!user) {
			return res.send({message: 'User not found'})
		}

		mailgun.sendText(`service@${config.MAILGUN.SANDBOX_DOMAIN}`, [user.email],
            `Your WNF profile was declined`,
            `Unfortunately, your WiseNewsFeed profile was declined.`,
            err => res.send(err)
        )
	})
})

router.get('/upgrade', (req, res) => {
	let {id, role} = req.query

	models.User.update(id, {role}, (err, user) => {
		if (err) res.status(400).send(err)
		else {
			mailgun.sendText(`service@${config.MAILGUN.SANDBOX_DOMAIN}`, [user.email],
				`Your WNF profile was approved!`,
				`Congratulations! Your WiseNewsFeed profile was upgraded to ${role}!`,
				err => res.send(err)
			)
        }
	})
})

module.exports = router
