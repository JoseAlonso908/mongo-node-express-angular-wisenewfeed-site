const async = require('async')

var Model = function(mongoose) {
	const sha1 = require('sha1')

	var schema = new mongoose.Schema({
		ObjectId: mongoose.Schema.ObjectId,
		facebook		: String,
		linkedin		: String,
		twitter			: String,
		facebookName	: String,
		linkedinName	: String,
		twitterName		: String,
		avatar			: {type: String, default: '/assets/images/avatar_placeholder.png'},
		wallpaper		: String,
		name			: String,
		intro			: String,
		email			: String,
		password		: {type: String, select: false},
		phone			: String,
		country			: String,
		position		: String,
		company 		: String,
		field			: String,
		role 			: String,
		title 			: String,
		company			: String,
		contact 		: {
			email: String,
			phone: String,
			skype: String,
			linkedin: String,
			fb: String,
		},
		certificates: [{
			filename	: String,
			filepath	: String,
		}],
		downloads: [{
			filename	: String,
			filepath	: String,
		}],
		experience	: [{
			time		: String,
			place		: String,
			description	: String,
		}],
		notifications: {
			expert 		: {type: Boolean, default: true},
			journalist 	: {type: Boolean, default: true},
			liked 		: {type: Boolean, default: true},
			reacted 	: {type: Boolean, default: true},
		},
	})

	var Model = mongoose.model('user', schema);

	return {
		findOne: (params, callback) => {
			Model.findOne(params, callback)
		},

		findById: (_id, callback) => {
			if (typeof _id !== 'object') _id = mongoose.Types.ObjectId(_id)
			Model.findOne({_id}, callback)
		},

		getByCredentials: (email, password, callback) => {
			password = sha1(password)

			Model.findOne({email, password}, callback)
		},

		isPasswordValid: (_id, password, callback) => {
			if (typeof _id !== 'object') _id = mongoose.Types.ObjectId(_id)
			
			password = sha1(password)

			Model.findOne({_id, password}, (err, user) => {
				if (user) return callback(true)
				else return callback(false)
			})
		},

		findByEmail: (email, callback) => {
			Model.findOne({email}, callback)
		},

		findByPhone: (phone, callback) => {
			Model.findOne({phone}, callback)
		},

		findByEmailOrPhone: (value, callback) => {
			Model.findOne({$or: [{email: value}, {phone: value}]}, callback)
		},

		createUser: (params, callback) => {
			if (params.password) params.password = sha1(params.password)
			if (!params.role) params.role = 'user'

			let user = new Model()
			Object.assign(user, params)
			user.save(callback)
		},

		setAvatar: (_id, avatar, callback) => {
			if (typeof _id !== 'object') _id = mongoose.Schema.Types.ObjectId(_id)

			Model.findOne({_id}, (err, user) => {
				Object.assign(user, {avatar})
				user.save(callback)
			})
		},

		setWallpaper: (_id, wallpaper, callback) => {
			if (typeof _id !== 'object') _id = mongoose.Schema.Types.ObjectId(_id)

			Model.findOne({_id}, (err, user) => {
				Object.assign(user, {wallpaper})
				user.save(callback)
			})
		},

		addCertificate: (_id, filename, filepath, callback) => {
			if (typeof _id !== 'object') _id = mongoose.Schema.Types.ObjectId(_id)

			Model.findOne({_id}, (err, user) => {
				user.certificates.push({filename, filepath})
				user.save(callback)
			})
		},

		getCertificateByName: (_id, filename, callback) => {
			if (typeof _id !== 'object') _id = mongoose.Schema.Types.ObjectId(_id)

			Model.findOne({_id}, (err, user) => {
				for (let cert of user.certificates) {
					if (cert.filename === filename) {
						return callback(cert)
					}
				}
			})
		},

		removeCertificateByName: (_id, filename, callback) => {
			if (typeof _id !== 'object') _id = mongoose.Schema.Types.ObjectId(_id)

			Model.findOne({_id}, (err, user) => {
				user.certificates = user.certificates.filter((cert) => {
					return cert.filename != filename
				})
				user.save(callback)
			})
		},

		addDownload: (_id, filename, filepath, callback) => {
			if (typeof _id !== 'object') _id = mongoose.Schema.Types.ObjectId(_id)

			Model.findOne({_id}, (err, user) => {
				user.downloads.push({filename, filepath})
				user.save(callback)
			})
		},

		getDownloadByName: (_id, filename, callback) => {
			if (typeof _id !== 'object') _id = mongoose.Schema.Types.ObjectId(_id)

			Model.findOne({_id}, (err, user) => {
				for (let cert of user.downloads) {
					if (cert.filename === filename) {
						return callback(cert)
					}
				}
			})
		},

		removeDownloadByName: (_id, filename, callback) => {
			if (typeof _id !== 'object') _id = mongoose.Schema.Types.ObjectId(_id)

			Model.findOne({_id}, (err, user) => {
				user.downloads = user.downloads.filter((file) => {
					return file.filename != filename
				})
				user.save(callback)
			})
		},

		update: (_id, data, callback) => {
			if (typeof _id !== 'object') _id = mongoose.Types.ObjectId(_id)

			Model.findOne({_id}, (err, user) => {
				Object.assign(user, data)
				user.save(callback)
			})
		},

		updatePassword: (_id, password, callback) => {
			if (typeof _id !== 'object') _id = mongoose.Schema.Types.ObjectId(_id)

			Model.findOne({_id}, (err, user) => {
				user.password = sha1(password)
				user.save(callback)
			})
		},

		updateOldPassword: (_id, password, newPassword, callback) => {
			if (typeof _id !== 'object') _id = mongoose.Types.ObjectId(_id)

			password = sha1(password)

			Model.findOne({_id, password}, (err, user) => {
				if (!user) {
					return callback({message: 'User not found'})
				}

				user.password = sha1(newPassword)
				user.save(callback)
			})
		},

		updateSettings: (_id, name, email, phone, country, field, language, callback) => {
			if (typeof _id !== 'object') _id = mongoose.Schema.Types.ObjectId(_id)

			Model.findOne({_id}, (err, user) => {
				Object.assign(user, {name, email, phone, country, field, language})
				user.save(callback)
			})
		},

		updateProfile: (_id, contact, experience, intro, name, position, callback) => {
			if (typeof _id !== 'object') _id = mongoose.Schema.Types.ObjectId(_id)

			intro = intro.replace(/(\n|\r\n|\n\r)/g, '<br>')

			Model.findOne({_id}, (err, user) => {
				Object.assign(user, {contact, experience, intro, name, position})
				user.save(callback)
			})
		},

		getReactionsOnUser: (_id, callback) => {
			let result = {
				likes: 0,
				dislikes: 0,
				reacts: 0,
				following: 0,
				followers: 0,
			}

			async.parallel([
				(cb) => {
					async.waterfall([
						// Get articles made by user
						(cb) => {
							models.Article.getByUserLean(_id, (err, articles) => {
								let articlesIds = articles.map((article) => {return article._id})
								cb(null, articlesIds)
							})
						},
						// Get reactions to user's articles
						(articlesIds, cb) => {
							models.PostReaction.findLean({post: {$in: articlesIds}}, (err, postsreactions) => {
								for (let reaction of postsreactions) {
									switch (reaction.type) {
										case 'like':
											result.likes++
											break
										case 'dislike':
											result.dislikes++
											break
									}
								}

								cb(null, articlesIds)
							})
						},
						// Get comment on user's articles
						(articlesIds, cb) => {
							models.Comment.getByArticlesLean(articlesIds, (err, comments) => {
								result.reacts = comments.length
								cb()
							})
						}
					], (err) => {
						cb()
					})
				},
				(cb) => {
					models.Follow.followingByFollower(_id, null, null, null, (err, following) => {
						result.following = following.length
						cb()
					})
				},
				(cb) => {
					models.Follow.followersByFollowing(_id, null, null, null, (err, followers) => {
						result.followers = followers.length
						cb()
					})
				},
			], (err) => {
				callback(result)
			})
		},

		updateNotificationsSettings: (_id, expert, journalist, liked, reacted, callback) => {
			Model.findOne({_id}, (err, user) => {
				Object.assign(user.notifications, {expert, journalist, liked, reacted})
				user.save(callback)
			})
		}
	}
}

module.exports = Model