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

	return {
		Model,

		findOneById: (_id, callback) => {
			console.log('AA1')
			console.log(_id)

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

		getAll: (category, country, start = 0, limit = 10, callback) => {
			let query = {}
			if (category) Object.assign(query, {category})
			if (country) Object.assign(query, {country})

			Model.find(query).select('-__v').populate([
				{path: 'author'},
				{path: 'sharedFrom', populate: {
					path: 'author',
				}}
			]).sort({createdAt: 'desc'}).skip(start).limit(limit).exec((err, articles) => {
				articles = articles.filter((article) => {
					if (!article.author) {
						return false
					}

					return true
				})

				callback(err, articles)
			})
		},

		getAllLean: (callback) => {
			Model.find().populate([
				{path: 'author'},
				{path: 'sharedFrom', populate: {
					path: 'author',
				}}
			]).lean().exec(callback)
		},

		getByUser: (author, callback) => {
			if (typeof author !== 'object') author = mongoose.Types.ObjectId(author)
			Model.find({author}).select('-__v').populate('author').sort({createdAt: 'desc'}).exec(callback)
		},

		getByUserLean: (author, callback) => {
			if (typeof author !== 'object') author = mongoose.Types.ObjectId(author)
			Model.find({author}).select('-__v').populate('author').sort({createdAt: 'desc'}).lean().exec(callback)
		},

		getByUsers: (authors, shares, category, country, start = 0, limit = 10, callback) => {
			authors = authors.map((id) => {
				if (typeof id !== 'object') return mongoose.Types.ObjectId(id)
				else return id
			})

			shares = shares.map((id) => {
				if (typeof id !== 'object') return mongoose.Types.ObjectId(id)
				else return id
			})

			let query = {$or: [{author: {$in: authors}}, {_id: {$in: shares}}]}
			if (category) Object.assign(query, {category})
			if (country) Object.assign(query, {country})

			Model.find(query).populate([
				{path: 'author'},
				{path: 'sharedFrom', populate: {
					path: 'author',
				}}
			]).sort({createdAt: 'desc'}).skip(start).limit(limit).exec(callback)
		},

		getLikedOfUser: (author, callback) => {
			if (typeof author !== 'object') author = mongoose.Types.ObjectId(author)

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

					callback(err, articles)
				})
			})
		},

		getDislikedOfUser: (author, callback) => {
			if (typeof author !== 'object') author = mongoose.Types.ObjectId(author)

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

					callback(err, articles)
				})
			})
		},

		getCommentedOfUser: (author, callback) => {
			if (typeof author !== 'object') author = mongoose.Types.ObjectId(author)

			Model.find({author}).populate([
				{path: 'author'},
				{path: 'sharedFrom', populate: {
					path: 'author',
				}}
			]).sort({createdAt: 'desc'}).exec((err, articles) => {
				let postIds = articles.map((article) => {return article._id})

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

					callback(err, commentedArticles)
				})
			})
		},
	}
}

module.exports = Model