const async = require('async'),
    metascraper = require('metascraper')

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
        sharedIn: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'article',
        }],
		images		: [{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'image',
		}],
        countries 	: [{
            type: mongoose.Schema.Types.String
        }],
        title		: String,
		text		: String,
		createdAt	: {type: Date, default: Date.now},
		country		: String,
		category	: String,
        privacy		: {
            type: String,
            enum: ['Family', 'Close friend', 'Friend', 'Stranger'],
			default: 'Stranger'
        },
		meta		: mongoose.Schema.Types.Mixed
	})
    schema.index({countries: 1})
	var Model = mongoose.model('article', schema);

	this.postProcessList = (articles, user, callback) => {
		articles = articles.map((a) => {
			if (typeof a.toObject === 'function') return a.toObject()

			if (!a.sharedFrom || !a.sharedFrom._id) {
				delete a.sharedFrom
			}

			if (a.friendship && a.friendship.length > 0) {
                a.friendship = a.friendship[0]
			}

			return a
		})

		async.waterfall([
			// Remove images based to their privacy
			(next) => {
				async.map(articles, (a, nextArticle) => {
                    if (!a.images || a.images.length == 0) {
                    	return nextArticle(null, a)
                    }

                    models.Image.retainImagesPrivacy(a.images, a.author, user, (err, images) => {
                    	a.images = images
                        nextArticle(null, a)
					})
				}, (err, result) => {
					articles = result
                    next()
				})
			},

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

	this.getFilterAggregationOptions = (filter, viewer, options) => {
		if (!options) {
			options = {}
		}

        let filterAggregationParams = [
            {
                $lookup: {
                    from: 'friendships',
                    localField: 'author',
                    foreignField: 'user',
                    as: 'friendships1',
                }
            },
            {
                $lookup: {
                    from: 'friendships',
                    localField: 'author',
                    foreignField: 'friend',
                    as: 'friendships2',
                },
            },
            {
                $project: {
                    friendship: {
                        $filter: {
                            input: {
                                $concatArrays: ['$friendships1', '$friendships2']
							},
                            as: 'f',
                            cond: {
                            	$and: [
									{
										$ne: ['$author', MOI(viewer)],
									},
									{
										$or: [
											{$eq: ['$$f.user', MOI(viewer)]},
											{$eq: ['$$f.friend', MOI(viewer)]},
										]
									},
									{
										$eq: ['$$f.accepted', true],
									},
								]
                            }
                        }
                    },
                    author: true,
                    sharedFrom: true,
                    sharedIn: true,
                    images: true,
                    countries: true,
                    title: true,
                    text: true,
                    createdAt: true,
                    country: true,
                    category: true,
                    privacy: true,
                    meta: true,
                },
            },
			{
				$match: {
					$or: [
						{
							author: MOI(viewer),
						},
						{
							privacy: {$exists: false},
						},
						{
							privacy: 'Stranger',
						},
						{
							$and: [
								{privacy: 'Friend'},
								{'friendship.0.type': {$in: ['Friend', 'Close friend', 'Family']}},
							],
						},
						{
							$and: [
								{privacy: 'Close friend'},
								{'friendship.0.type': {$in: ['Family', 'Close friend']}},
							],
						},
						{
							$and: [
								{privacy: 'Family'},
								{'friendship.0.type': {$in: ['Family']}},
							],
						},
					]
				},
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
            {
                $lookup: {
                    from: 'images',
                    localField: 'images',
                    foreignField: '_id',
                    as: 'images',
                }
            }
		]

        if (options['nousers'] === true) {
            filterAggregationParams.push({
            	$match: {
            		'author.role': {
            			$ne: 'user'
					}
				}
			})
        }

		switch (filter) {
			case 'top':
                filterAggregationParams = filterAggregationParams.concat([
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
							title: 1,
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
				])
				break;
			case 'news':
                filterAggregationParams = filterAggregationParams.concat([
					{
						$sort: {createdAt: -1},
					},
				])
				break;
			case 'journalist':
			case 'expert':
                filterAggregationParams = filterAggregationParams.concat([
					{
						$match: {"author.role": filter},
					},
					{
						$sort: {createdAt: -1},
					},
				])
				break;
			case 'photos':
                filterAggregationParams = filterAggregationParams.concat([
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
				])
				break;
		}
        if (options.expertsOnly) {
            filterAggregationParams = filterAggregationParams.concat([
                {
                    $match: {
                    	$or: [
                    		{'author.role': 'expert'},
                            {'author.role': 'journalist'}
						]
                    }
                },
            ])
        }
        return filterAggregationParams;
	}

    /**
     * Get countries tags array without tag symbol
     * param: String text - article body
     * returns: Array with strings
     * */
    this.extractCountries = text => {
        const regex = /(<br>|<q>|<\/q>|^|\s|&nbsp;)!([a-z]+[a-z0-9]+)/gmi
        let countriesFound = new Set()
        let m
        while ((m = regex.exec(text)) !== null) {
            if (m.index === regex.lastIndex) {
                regex.lastIndex++
            }
            // If result is not empty and unique
            if (m[2] && m[2].length > 0) {
                countriesFound.add(m[2])
            }
        }
        return Array.from(countriesFound)
    }

	return {
		Model,

		findOneById: (_id, callback) => {
			_id = MOI(_id)
			Model.findOne({_id}).populate([
				{path: 'author'},
				{path: 'sharedFrom', populate: {
					path: 'author',
				}},
                {path: 'sharedFrom', populate: {
                    path: 'images', populate: {
                        path: 'author',
                    }
                }},
                {path: 'images', populate: {
                    path: 'author',
                }}
			]).lean().exec((err, article) => {
				if (article && article.sharedFrom) {
					models.User.setXpInfo(article.sharedFrom.author, (err, user) => {
						article.sharedFrom.author = user
						callback(err, article)
					})
				} else {
					callback(err, article)
				}
			})
		},

		create: (data, callback) => {
			let {author, country, category, title, text, images, allowhtml, meta, privacy} = data
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
            //TODO: Should we add author`s country to this array ?
            const countries = this.extractCountries(text)

			let article = new Model()
			Object.assign(article, {
				author, images, title, text, country, category, meta, countries, privacy
			})
			article.save(callback)
		},

		edit: (_id, author, text, images, callback) => {
			author = MOI(author)

			Model.findOne({_id, author}).exec((err, post) => {
				var buf = []
				for (var i = text.length - 1; i >= 0; i--) {
					if ((['>', '<', '/', '"']).indexOf(text[i]) == -1) buf.unshift(text[i])
					else buf.unshift(['&#', text[i].charCodeAt(), ';'].join(''));
				}
				text = buf.join('')

				text = text.replace(/(\n|\r\n|\n\r)/g, '<br>')
                const countries = this.extractCountries(text)

                Object.assign(post, {text, countries})
				post.save(callback)
			})
		},

		share: (author, sharedFrom, callback) => {
			if (typeof author !== 'object') author = mongoose.Types.ObjectId(author)
			if (typeof sharedFrom !== 'object') sharedFrom = mongoose.Types.ObjectId(sharedFrom)

			Model.findOne({_id: sharedFrom}).exec((err, sharedFrom) => {
				async.waterfall([
					next => {
                        let article = new Model()
                        Object.assign(article, {
                            author,
                            sharedFrom: sharedFrom._id,
                            country: sharedFrom.country,
                            category: sharedFrom.category,
                        })
                        article.save((err, savedArticle) => {
                            next(err, savedArticle)
                        })
                    },
                    (repost, next) => {
                        if (!repost) return next()
                        sharedFrom.sharedIn.push(repost._id)
                        sharedFrom.save((err, result) => {
                            next(err, repost)
                        })
                    }
				], callback)
			})
		},

		unshare: (author, sharedFrom, callback) => {
			if (typeof author !== 'object') author = mongoose.Types.ObjectId(author)
			if (typeof sharedFrom !== 'object') sharedFrom = mongoose.Types.ObjectId(sharedFrom)

			async.waterfall([
                next => {
                    Model.findOneAndRemove({author, sharedFrom}, next)
                },
                (post, next) => {
             		if (!post || !post._id) next() /*TODO:  <--- Some shit is here */
                    Model.update({ _id: sharedFrom }, { $pull: { 'sharedIn': post._id }}, next)
                }
            ], callback)
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

			let filterAggregationOptions = [];

			if (!filter) filter = 'news'
			filterAggregationOptions = this.getFilterAggregationOptions(filter, viewer, {expertsOnly: true})

			var aggregationOptions = [
				{
					$match: query
				}
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
					// =( Have no time but need to fix. THis is Hack. Need to be replaced with aggregation
					if (articles && articles.length > 0) {
                        async.eachSeries(articles, (article, cb) => {
							if (article && article.images) {
								for (let i in article.images) {
                                    if (article.images[i].author) {
                                    	if (article.author && article.author._id && article.images[i].author.toString() === article.author._id.toString()) {
                                            article.images[i].author = article.author
										}
									}
								}
							}
							cb(null)
                        }, (err) => {
                            this.postProcessList(articles, viewer, callback)
                        })

					} else {
                        this.postProcessList(articles, viewer, callback)
                    }
				}
			})
		},

		searchForTags: (viewer, tagchar, q, limit, callback) => {
			if (tagchar == '$') {
				tagchar = '\\$'
			} else if (tagchar == '!') {
				tagchar = '\\!'
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

			start = Number(start)
			limit = Number(limit)

			if (!filter) filter = 'news'
			filterAggregationOptions = this.getFilterAggregationOptions(filter, viewer)

			var aggregationOptions = [
				{
					$match: query
				},
			]

			aggregationOptions = aggregationOptions.concat(filterAggregationOptions)
			aggregationOptions = aggregationOptions.concat([{$skip: start}, {$limit: limit}])

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

		getAllLean: (callback) => {
			Model.find().populate([
				{path: 'author'},
				{path: 'sharedFrom', populate: {
					path: 'author',
				}},
				{path: 'images', populate: {
                    path: 'author',
                }},
			]).lean().exec((err, articles) => {
				this.postProcessList(articles, null, callback)
			})
		},

		getByUser: (author, viewer, start = 0, limit = 100, callback) => {
			author = MOI(author)

			start = Number(start)
			limit = Number(limit)

            let filterAggregationOptions = [];

            filterAggregationOptions = this.getFilterAggregationOptions('news', viewer)

            var aggregationOptions = [
                {
                    $match: {author}
                },
            ]

            aggregationOptions = aggregationOptions.concat(filterAggregationOptions)
            if (start) aggregationOptions.push({$skip: start})
            if (limit) aggregationOptions.push({$limit: limit})

            Model.aggregate(aggregationOptions).exec((err, articles) => {
                this.postProcessList(articles, viewer, callback)
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

		getByUsers: (parameters, callback) => {
			let {authors, viewer, shares, category, country, start, limit, privacy} = parameters
			if (!start) start = 0
			if (!limit) limit = 4
			authors = (authors) ? authors.map(MOI) : authors
			shares = (shares) ? shares.map(MOI) : shares

			start = Number(start)
			limit = Number(limit)

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
			if (country) Object.assign(query, {text: new RegExp(`\\!${country}`, 'gi')})
			// if (privacy) {
			// 	const privacyIncluded = models.Article.getPrivacySubLevels(privacy)
             //    Object.assign(query, {privacy: {$in: privacyIncluded}})
			// }

            let filterAggregationOptions = [];

			if (parameters.nousers === undefined) {
                parameters.nousers = true
			}

            filterAggregationOptions = this.getFilterAggregationOptions('news', parameters.viewer, {nousers: parameters.nousers})

            var aggregationOptions = [
                {
                    $match: query
                },
            ]

            aggregationOptions = aggregationOptions.concat(filterAggregationOptions)
            if (start) aggregationOptions.push({$skip: start})
            if (limit) aggregationOptions.push({$limit: limit})

			Model.aggregate(aggregationOptions).exec((err, articles) => {
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
						country: 1, category: 1, title: 1, text: 1, images: 1, author: 1, createdAt: 1, sharedFrom: 1,
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
						country: 1, category: 1, title: 1, text: 1, images: 1, author: 1, createdAt: 1, sharedFrom: 1,
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
						country: 1, category: 1, title: 1, text: 1, images: 1, author: 1, createdAt: 1, sharedFrom: 1,
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

        /**
		 *  Get first link meta tags
		 *  params: String text of article
		 *  returns: Object
		 **/
        getFirstLinkMeta: text => {
            return new Promise((resolve, reject) => {
                if (!text) return reject('No text provided')
                const urlRegex = /(https?:\/\/[^\s]+)/g
                let parsedResults = text.match(urlRegex)
				let parsedMeta = undefined
                if (parsedResults && parsedResults.length > 0) {
                	/* Fake error used to break async.each on first url with meta info*/
                    async.eachSeries(parsedResults, (url, cb) => {
                        metascraper.scrapeUrl(url).then((meta) => {
                        	let withMeta = null
                            if (meta.title && meta.description && ['YouTube', 'Vimeo'].indexOf(meta.publisher) == -1) {
								withMeta = true
                                parsedMeta = meta
                            }
                            cb(withMeta)
                        })
                    }, (err, meta) => {
                    	return resolve(parsedMeta)
                    })
                } else {
                    return resolve()
                }
            })
        },

		/**
		 * Helper for transforming countries names like "United Arab Emirates"
		 * to tags like !unitedarabemirates
		 **/
		transformToTag: country => {
            if (!country) return country
            country = country.replace(/\s/g, '')
            return country.toLowerCase()
        },

		/**
		 * Get count of posts tagged by each country
		 * returns Array
		 * */
        postsCountPerCountry: () => {
            return new Promise((resolve, reject) => {
                Model.aggregate([
                    {$project: {_id: 0, countries: 1}},
                    {$unwind: "$countries"},
                    {$group: {_id: "$countries", count: {$sum: 1}}},
                    {$project: {_id: 0, country: "$_id", count: 1}},
                    {$sort: {tags: -1}}
                ]).exec((err, result) => {
                    if (err) return reject(err)
                    resolve(result)
                })
            })
        },
		/**
		 * Get nicknames mentioned in text (tagged as @nickname)
		 * @param text String
		 * @returns Array of
		 * */
		getMentionedNicknames: text => {
			if(!text) return []
			let matches = text.match(/@([a-z]+[a-z0-9]+)/gmi)
			if (!matches || matches.length < 1) return []
            return matches.map(item => {
                if (item) return item.trim().substring(1)
            })
		},
		/**
		 * Get sub levels of privacy.
		 * ('Family' can see things for 'friends' and 'close friends' and for 'strangers',
		 * but 'friend' can not see thing with privacy 'family' etc
		 *
		 * @param privacy String privacy lvl
		 * @returns Array of subLevels
		 * */
		getPrivacySubLevels: privacy => {
			const levels = {
                'Family'		: ['Family', 'Close friend', 'Friend', 'Stranger'],
                'Close friend'	: ['Close friend', 'Friend', 'Stranger'],
                'Friend'		: ['Friend', 'Stranger'],
                'Stranger'		: ['Stranger']
            }
            if (privacy && levels.hasOwnProperty(privacy)) return levels[privacy]
			return levels['Stranger']
		}
	}
}

module.exports = Model
