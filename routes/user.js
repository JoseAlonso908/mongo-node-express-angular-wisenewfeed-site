const 	express = require('express'),
		multer = require('multer'),
		async = require('async'),
		path = require('path'),
		fs = require('fs')

const config = require('./../config')

let tempUploads = multer({
	dest: '../temp/',
	limits: {
		fileSize: 5 * 1024 * 1024
	}
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
	let {name, email, phone, country, field, language} = req.body

	if (user) {
		models.User.updateSettings(user._id, name, email, phone, country, field, language, () => {
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

router.get('/user/categories', (req, res) => {
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

		models.Article.getByUsers(authors, null, [], null, null, null, null, (err, articles) => {
			if (err) res.status(400).send(err)
			else {
				for (let article of articles) {
					if ((country && article.country != country) || !article.author) continue

					for (let category of categories) {
						if (article.category == category.title) {
							category.count++
							break
						}
					}
				}

				res.send(categories)
			}
		})
	})
})

router.get('/user/mutedauthors', (req, res) => {
	let user = req.user

	models.MutedAuthor.getMutedByUser(user._id, (err, authors) => {
		if (err) return res.status(400).send(err)
		else return res.send(authors)
	})
})

router.post('/user/block', (req, res) => {
	let user = req.user,
		blocked = req.body.user

	models.BlockedUser.block(blocked, user._id, (err, result) => {
		if (err) res.status(400).send(err)
		else res.send({ok: true})
	})
})

router.post('/user/unblock', (req, res) => {
	let user = req.user,
		blocked = req.body.user

	models.BlockedUser.unblock(blocked, user._id, (err, result) => {
		if (err) res.status(400).send(err)
		else res.send({ok: true})
	})
})

router.post('/user/report', (req, res) => {
	let user = req.user
	let {article} = req.body

	models.Report.report(article, user._id, (err, result) => {
		if (err) res.status(400).send(err)
		else res.send({ok: true})
	})
})

router.get('/user/images', (req, res) => {
	let {user} = req.query

	models.Article.getImagesByUser(user, (err, result) => {
		if (err) res.status(400).send(err)
		else res.send(result)
	})
})

module.exports = router