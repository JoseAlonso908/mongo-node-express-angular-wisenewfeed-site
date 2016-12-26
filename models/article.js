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

			if (!a.sharedFrom || !a.sharedFrom._id) {
				delete a.sharedFrom
			}

			return a
		})

		async.waterfall([
			(next) => {
				async.mapSeries(articles, (a, mapNext) => {
					models.User.setXpInfo(a.author, (err, user) => {
						a.author = user
						mapNext(null, a)
					})
				}, next)
			},

			(articles, next) => {
				async.mapSeries(articles, (a, mapNext) => {
					if (!a.sharedFrom || !a.sharedFrom.author) return mapNext(null, a)

					models.User.setXpInfo(a.sharedFrom.author, (err, user) => {
						a.sharedFrom.author = user
						mapNext(null, a)
					})
				}, next)
			},

			// Check article to be hidden for specific user
			(articles, next) => {
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

						if (!a.author instanceof mongoose.Types.ObjectId && muted[a.author._id.toString()]) {
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

						if (!a.author instanceof mongoose.Types.ObjectId && blocked[a.author._id.toString()]) {
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

	this.getFilterAggregationOptions = (filter) => {
		let filterAggregationOptions = []

		switch (filter) {
			case 'top':
				filterAggregationParams = [
					{
						$lookup: {
							from: 'postreactions',
							localField: '_id',
							foreignField: 'post',
							as: 'reactions',
						},
					},
					{
						$project: {
							category: 1,
							country: 1,
							text: 1,
							author: 1,
							createdAt: 1,
							images: 1,
							reactionsCount: {$size: {
								$filter: {
									input: '$reactions',
									as: 'r',
									cond: {$eq: ['$$r.type', 'like']},
								},
							}},
						},
					},
					{
						$sort: {reactionsCount: -1},
					},
				]
				break;
			case 'news':
				filterAggregationParams = [
					{
						$sort: {createdAt: -1},
					},
				]
				break;
			case 'journalist':
			case 'expert':
				filterAggregationParams = [
					{
						$match: {"author.role": filter},
					},
					{
						$sort: {createdAt: -1},
					},
				]
				break;
			case 'photos':
				filterAggregationParams = [
					{
						$match: {
							"images.0": {$exists: true},
						},
					},
					{
						$sort: {createdAt: -1},
					},
					{
						$unwind: {path: '$images'},
					},
					{
						$project: {images: 1},
					},
				]
				break;
		}

		return filterAggregationParams
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
			]).lean().exec((err, article) => {
				if (article.sharedFrom) {
					models.User.setXpInfo(article.sharedFrom.author, (err, user) => {
						article.sharedFrom.author = user
						callback(err, article)
					})
				} else {
					callback(err, article)
				}
			})
		},

		create: (author, country, category, text, images, allowhtml, callback) => {
			author = MOI(author)

			if (!allowhtml) {
				var buf = []
				for (var i = text.length - 1; i >= 0; i--) {
					if ((['>', '<', '/', '"']).indexOf(text[i]) == -1) buf.unshift(text[i])
					else buf.unshift(['&#', text[i].charCodeAt(), ';'].join(''));
				}
				text = buf.join('')
			}

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

		getAll: (viewer, category, country, filter, start = 0, limit = 4, callback) => {
			let query = {}
			if (category) Object.assign(query, {text: new RegExp(`\\$${category}`, 'gi')})
			if (country) Object.assign(query, {country})

			start = Number(start)
			limit = Number(limit)

			var filterAggregationOptions = []

			if (!filter) filter = 'news'
			filterAggregationOptions = this.getFilterAggregationOptions(filter)

			var aggregationOptions = [
				{
					$match: query
				},
				{
					$lookup: {
						from: 'users',
						localField: 'author',
						foreignField: '_id',
						as: 'author'
					}
				},
				{
					$unwind: {
						path: '$author',
						preserveNullAndEmptyArrays: true
					},
				},
				{
					$lookup: {
						from: 'articles',
						localField: 'sharedFrom',
						foreignField: '_id',
						as: 'sharedFrom'
					}
				},
				{
					$unwind: {
						path: '$sharedFrom',
						preserveNullAndEmptyArrays: true
					}
				},
				{
					$lookup: {
						from: 'users',
						localField: 'sharedFrom.author',
						foreignField: '_id',
						as: 'sharedFrom.author'
					}
				},
				{
					$unwind: {
						path: '$sharedFrom.author',
						preserveNullAndEmptyArrays: true
					}
				},
			]

			aggregationOptions = aggregationOptions.concat(filterAggregationOptions)
			if (start) aggregationOptions.push({$skip: start})
			if (limit) aggregationOptions.push({$limit: limit})

			Model.aggregate.apply(Model, aggregationOptions).exec((err, articles) => {
				if (filter == 'photos') {
					let images = []
					for (let a of articles) {images = images.concat(a.images)}
					callback(null, images)
				} else {
					this.postProcessList(articles, viewer, callback)
				}
			})
		},

		searchForTags: (viewer, tagchar, q, limit, callback) => {
			if (tagchar == '$') {
				tagchar = '\\$'
			}

			let r = new RegExp(`${tagchar}[a-z]*[a-z0-9]*${q}[a-z0-9]*`, 'gi')
			var tags = []

			Model.find({text: r})/*.populate([
				{path: 'author'},
				{path: 'sharedFrom', populate: {
					path: 'author',
				}}
			])*/.lean().exec((err, articles) => {
				this.postProcessList(articles, viewer, (err, articles) => {
					for (let a of articles) {
						let aTags = a.text.match(r)

						aTags = aTags.map((t) => t.toLowerCase())

						tags.push(...aTags)
					}

					// Make tags unique
					tags = [...new Set(tags)]

					callback(err, tags)
				})
			})
		},

		search: (viewer, q, category, country, filter, start = 0, limit = 4, callback) => {
			let query = {}

			Object.assign(query, {$and: [
					{text: new RegExp(q.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi')}
				]
			})

			if (category) {
				query['$and'].push({text: new RegExp(`\\$${category}`, 'gi')})
			}
			if (country) Object.assign(query, {country})

			console.log(query)

			start = Number(start)
			limit = Number(limit)

			if (!filter) filter = 'news'
			filterAggregationOptions = this.getFilterAggregationOptions(filter)

			var aggregationOptions = [
				{
					$match: query
				},
				{
					$lookup: {
						from: 'users',
						localField: 'author',
						foreignField: '_id',
						as: 'author'
					}
				},
				{
					$unwind: {
						path: '$author',
						preserveNullAndEmptyArrays: true
					},
				},
				{
					$lookup: {
						from: 'articles',
						localField: 'sharedFrom',
						foreignField: '_id',
						as: 'sharedFrom'
					}
				},
				{
					$unwind: {
						path: '$sharedFrom',
						preserveNullAndEmptyArrays: true
					}
				},
				{
					$lookup: {
						from: 'users',
						localField: 'sharedFrom.author',
						foreignField: '_id',
						as: 'sharedFrom.author'
					}
				},
				{
					$unwind: {
						path: '$sharedFrom.author',
						preserveNullAndEmptyArrays: true
					}
				},
			]

			aggregationOptions = aggregationOptions.concat(filterAggregationOptions)
			aggregationOptions = aggregationOptions.concat([{$skip: start}, {$limit: limit}])

			Model.aggregate.apply(Model, aggregationOptions).exec((err, articles) => {
				console.log(err)
				console.log(articles)

				if (filter == 'photos') {
					let images = []
					for (let a of articles) {images = images.concat(a.images)}
					callback(null, images)
				} else {
					this.postProcessList(articles, viewer, callback)
				}
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

		getReactedOfUser: (author, viewer, type, skip, limit, callback) => {
			author = MOI(author)

			skip = Number(skip)
			limit = Number(limit)

			Model.aggregate(
				// Filter articles by author
				{
					$match: {author}
				},
				// Join "reactions" to each article
				{
					$lookup: {
						from: 'postreactions',
						localField: '_id',
						foreignField: 'post',
						as: 'reactions'
					}
				},
				// Remove articles that have reaction of a different type
				{
					$match: {
						reactions: {
							$elemMatch: {type}
						}
					}
				},
				// Remove unnecessary reactions from articles
				{
					$project: {
						country: 1, category: 1, text: 1, images: 1, author: 1, createdAt: 1, sharedFrom: 1,
						reactions: {
							$filter: {
								input: '$reactions',
								as: 'item',
								cond: {$eq: ["$$item.type", type]}
							}
						}
					}
				},
				// Calculate reactions count for each article
				{
					$project: {
						country: 1, category: 1, text: 1, images: 1, author: 1, createdAt: 1, sharedFrom: 1,
						reactionsCount: {
							$size: '$reactions'
						}
					}
				},
				// Sort articles by descending reactions count
				{
					$sort: {reactionsCount: -1}
				},
				/// Join authors
				{
					$lookup: {
						from: 'users',
						localField: 'author',
						foreignField: '_id',
						as: 'author'
					}
				},
				// Blah blah blah
				{$unwind: "$author"},
				{
					$lookup: {
						from: 'articles',
						localField: 'sharedFrom',
						foreignField: '_id',
						as: 'sharedFrom'
					}
				},
				{
					$unwind: {
						path: '$sharedFrom',
						preserveNullAndEmptyArrays: true
					}
				},
				{
					$lookup: {
						from: 'users',
						localField: 'sharedFrom.author',
						foreignField: '_id',
						as: 'sharedFrom.author'
					}
				},
				{
					$unwind: {
						path: '$sharedFrom.author',
						preserveNullAndEmptyArrays: true
					}
				},
				{$skip: skip},
				{$limit: limit}
			).exec((err, articles) => {
				this.postProcessList(articles, viewer, callback)
			})
		},

		getCommentedOfUser: (author, viewer, skip, limit, callback) => {
			author = MOI(author)

			skip = Number(skip)
			limit = Number(limit)

			Model.aggregate(
				{
					$match: {author}
				},
				// Join "comments" to each article
				{
					$lookup: {
						from: 'comments',
						localField: '_id',
						foreignField: 'post',
						as: 'comments'
					}
				},
				// Calculate comments count for each article
				{
					$project: {
						country: 1, category: 1, text: 1, images: 1, author: 1, createdAt: 1, sharedFrom: 1,
						commentsCount: {
							$size: '$comments'
						}
					}
				},
				// Sort articles by descending comments count
				{
					$sort: {commentsCount: -1}
				},
				/// Join authors
				{
					$lookup: {
						from: 'users',
						localField: 'author',
						foreignField: '_id',
						as: 'author'
					}
				},
				// Blah blah blah
				{$unwind: "$author"},
				{
					$lookup: {
						from: 'articles',
						localField: 'sharedFrom',
						foreignField: '_id',
						as: 'sharedFrom'
					}
				},
				{
					$unwind: {
						path: '$sharedFrom',
						preserveNullAndEmptyArrays: true
					}
				},
				{
					$lookup: {
						from: 'users',
						localField: 'sharedFrom.author',
						foreignField: '_id',
						as: 'sharedFrom.author'
					}
				},
				{
					$unwind: {
						path: '$sharedFrom.author',
						preserveNullAndEmptyArrays: true
					}
				},
				{$skip: skip},
				{$limit: limit}
			).sort({createdAt: 'desc'}).skip(skip).limit(limit).exec((err, articles) => {
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