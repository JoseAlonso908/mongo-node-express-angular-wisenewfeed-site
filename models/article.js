const async = require('async')

var Model = function(mongoose) {
	var schema = new mongoose.Schema({
		ObjectId	: mongoose.Schema.ObjectId,
		author		: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'user',
		},
		sharedFrom	: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'article',
		},
		images		: [String],
		text		: String,
		createdAt	: {type: Date, default: Date.now},
		country		: String,
		category	: String,
	})

	var Model = mongoose.model('article', schema);

	this.postProcessList = (articles, user, callback) => {
		articles = articles.map((a) => {
			if (typeof a.toObject === 'function') return a.toObject()
			return a
		})

		async.waterfall([
			// Check article to be hidden for specific user
			(next) => {
				if (!user) return next(null, articles)

				let articleIds = articles.map((a) => a._id)

				models.HiddenArticle.isHiddenForUserMulti(articleIds, user, (err, hidden) => {
					articles = articles.map((a) => {
						a.hidden = false

						if (hidden[a._id.toString()]) {
							a.hidden = true
						}

						return a
					})

					next(null, articles)
				})
			},
			// Check author to be muted for specific user
			(articles, next) => {
				if (!user) return next(null, articles)

				let articleAuthorIds = articles.map((a) => a.author._id)

				models.MutedAuthor.isMutedForUserMulti(articleAuthorIds, user, (err, muted) => {
					articles = articles.map((a) => {
						a.muted = false

						if (muted[a.author._id.toString()]) {
							a.muted = true
						}

						return a
					})

					next(null, articles)
				})
			},
			// Check author to be blocked for specific user
			(articles, next) => {
				if (!user) return next(null, articles)

				let articleAuthorIds = articles.map((a) => a.author._id)

				models.BlockedUser.isBlockedForUserMulti(articleAuthorIds, user, (err, blocked) => {
					articles = articles.map((a) => {
						a.blocked = false

						if (blocked[a.author._id.toString()]) {
							a.blocked = true
						}

						return a
					})

					next(null, articles)
				})
			},
			// Remove articles whose author is not available
			(articles, next) => {
				articles = articles.filter((article) => {
					if (!article.author) {
						return false
					}

					return true
				})

				next(null, articles)
			},
		], callback)
	}

	return {
		Model,

		findOneById: (_id, callback) => {
			if (typeof _id !== 'object') _id = mongoose.Types.ObjectId(_id)
			Model.findOne({_id}).populate([
				{path: 'author'},
				{path: 'sharedFrom', populate: {
					path: 'author',
				}}
			]).lean().exec(callback)
		},

		create: (author, country, category, text, images, callback) => {
			if (typeof author !== 'object') author = mongoose.Types.ObjectId(author)

			text = text.replace(/(\n|\r\n|\n\r)/g, '<br>')

			let article = new Model()
			Object.assign(article, {
				author, images, text, country, category,
			})
			article.save(callback)
		},

		share: (author, sharedFrom, callback) => {
			if (typeof author !== 'object') author = mongoose.Types.ObjectId(author)
			if (typeof sharedFrom !== 'object') sharedFrom = mongoose.Types.ObjectId(sharedFrom)

			Model.findOne({_id: sharedFrom}).exec((err, sharedFrom) => {
				let article = new Model()
				Object.assign(article, {
					author,
					sharedFrom: sharedFrom._id,
					country: sharedFrom.country,
					category: sharedFrom.category,
				})
				article.save(callback)
			})
		},

		unshare: (author, sharedFrom, callback) => {
			if (typeof author !== 'object') author = mongoose.Types.ObjectId(author)
			if (typeof sharedFrom !== 'object') sharedFrom = mongoose.Types.ObjectId(sharedFrom)
			
			Model.remove({author, sharedFrom}, callback)
		},

		remove: (author, _id, callback) => {
			if (typeof author !== 'object') author = mongoose.Types.ObjectId(author)
			if (typeof _id !== 'object') _id = mongoose.Types.ObjectId(_id)

			Model.remove({_id, author}, callback)
		},

		getAll: (viewer, category, country, start = 0, limit = 4, callback) => {
			let query = {}
			if (category) Object.assign(query, {text: new RegExp(`\\$${category}`, 'gi')})
			if (country) Object.assign(query, {country})

			start = Number(start)
			limit = Number(limit)

			Model.find(query).select('-__v').populate([
				{path: 'author'},
				{path: 'sharedFrom', populate: {
					path: 'author',
				}}
			]).sort({createdAt: 'desc'}).skip(start).limit(limit).exec((err, articles) => {
				this.postProcessList(articles, viewer, callback)
			})
		},

		getAllLean: (callback) => {
			Model.find().populate([
				{path: 'author'},
				{path: 'sharedFrom', populate: {
					path: 'author',
				}}
			]).lean().exec((err, articles) => {
				this.postProcessList(articles, null, callback)
			})
		},

		getByUser: (author, start = 0, limit = 100, callback) => {
			author = MOI(author)

			start = Number(start)
			limit = Number(limit)

			Model.find({author}).select('-__v').populate([
				{path: 'author'},
				{path: 'sharedFrom', populate: {
					path: 'author',
				}}
			]).sort({createdAt: 'desc'}).skip(start).limit(limit).exec((err, articles) => {
				this.postProcessList(articles, null, callback)
			})
		},

		getImagesByUser: (author, callback) => {
			author = MOI(author)
			Model.find({author}).select('images').lean().exec((err, articles) => {
				let images = []
				articles.forEach((a) => {
					images = images.concat(a.images)
				})

				callback(err, images)
			})
		},

		getByUserLean: (author, callback) => {
			author = MOI(author)
			Model.find({author}).select('-__v').populate('author').sort({createdAt: 'desc'}).lean().exec((err, articles) => {
				this.postProcessList(articles, null, callback)
			})
		},

		getByUsers: (authors, viewer, shares, category, country, start = 0, limit = 4, callback) => {
			authors = (authors) ? authors.map(MOI) : authors
			shares = (shares) ? shares.map(MOI) : shares

			// let query = {$or: [{author: {$in: authors}}, {_id: {$in: shares}}]}
			let query = {$or: []}

			if (authors.length > 0) {
				query['$or'].push({author: {$in: authors}})
			}

			if (shares.length > 0) {
				query['$or'].push({_id: {$in: shares}})
			}

			if (query['$or'].length == 0) {
				query = {}
			}

			if (category) Object.assign(query, {text: new RegExp(`\\$${category}`, 'gi')})
			if (country) Object.assign(query, {country})
			Model.find(query).populate([
				{path: 'author'},
				{path: 'sharedFrom', populate: {
					path: 'author',
				}}
			]).sort({createdAt: 'desc'}).skip(start).limit(limit).exec((err, articles) => {
				this.postProcessList(articles, viewer, callback)
			})
		},

		getLikedOfUser: (author, viewer, callback) => {
			author = MOI(author)

			Model.find({author}).populate([
				{path: 'author'},
				{path: 'sharedFrom', populate: {
					path: 'author',
				}}
			]).sort({createdAt: 'desc'}).exec((err, articles) => {
				let postIds = articles.map((article) => {return article._id})

				let likedArticles = []

				models.PostReaction.getByPostIds(author, postIds, (err, reactions) => {
					articles = articles.filter((article) => {
						let postReactions = reactions[article._id.toString()].reactions

						if (postReactions.expert.likes + postReactions.journalist.likes + postReactions.user.likes > 0) {
							return true
						}

						return false
					})

					this.postProcessList(articles, viewer, callback)
				})
			})
		},

		getDislikedOfUser: (author, viewer, callback) => {
			author = MOI(author)

			Model.find({author}).populate([
				{path: 'author'},
				{path: 'sharedFrom', populate: {
					path: 'author',
				}}
			]).sort({createdAt: 'desc'}).exec((err, articles) => {
				let postIds = articles.map((article) => {return article._id})

				models.PostReaction.getByPostIds(author, postIds, (err, reactions) => {
					articles = articles.filter((article) => {
						let postReactions = reactions[article._id.toString()].reactions

						if (postReactions.expert.dislikes + postReactions.journalist.dislikes + postReactions.user.dislikes > 0) {
							return true
						}

						return false
					})

					this.postProcessList(articles, viewer, callback)
				})
			})
		},

		getCommentedOfUser: (author, viewer, callback) => {
			author = MOI(author)

			Model.find({author}).populate([
				{path: 'author'},
				{path: 'sharedFrom', populate: {
					path: 'author',
				}}
			]).sort({createdAt: 'desc'}).exec((err, articles) => {
				let postIds = articles.map((article) => article._id)

				let commentedArticles = []

				models.Comment.getByArticles(postIds, (err, comments) => {
					for (let comment of comments) {
						let articleFound = false

						for (let article of commentedArticles) {
							if (comment.post.toString() == article._id.toString()) {
								articleFound = true
								break
							}
						}

						if (!articleFound) {
							for (let article of articles) {
								if (comment.post.toString() == article._id.toString()) {
									commentedArticles.push(article)
									break
								}
							}
						}
					}

					this.postProcessList(commentedArticles, viewer, callback)
				})
			})
		},
	}
}

module.exports = Model