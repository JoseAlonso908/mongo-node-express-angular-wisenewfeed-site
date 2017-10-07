const async = require('async')

var Model = function(mongoose) {
	var schema = new mongoose.Schema({
		ObjectId	: mongoose.Schema.ObjectId,
		author		: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'user',
		},
		post		: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'article',
		},
		type		: {
			type: String,
			enum: ['like', 'dislike', 'share', 'smart', 'worthy'],
		},
		createdAt	: {type: Date, default: Date.now},
	})

	var Model = mongoose.model('postreaction', schema);

	return {
		Model,

		find: (query, callback) => {
			Model.find(query).exec(callback)
		},

		findLean: (query, callback) => {
			Model.find(query).lean().exec(callback)
		},

		react: (author, post, type, callback) => {
			if (typeof author !== 'object') author = MOI(author)
			if (typeof post !== 'object') post = MOI(post)

			Model.find({author, post}).lean().exec((err, existingReactions) => {
				// Check for reaction with same type
				let sameTypeExist = false,
					oppositeReaction
				for (let reaction of existingReactions) {
					if ((type == 'like' && reaction.type == 'dislike') || (type == 'dislike' && reaction.type == 'like')) {
						oppositeReaction = reaction
					}

					if (reaction.type == type) {
						sameTypeExist = true
					}
				}

				async.series([
					(callback) => {
						if (oppositeReaction) {
							Model.remove({_id: MOI(oppositeReaction._id)}, callback)
						} else callback()
					},
					(callback) => {
						if (!sameTypeExist) {
							let reaction = new Model()
							Object.assign(reaction, {author, post, type})
							reaction.save(callback)
						} else return callback()
					}
				], (err) => {
					callback()
				})
			})
		},

		unreact: (author, post, type, callback) => {
			if (typeof author !== 'object') author = mongoose.Types.ObjectId(author)
			if (typeof post !== 'object') post = mongoose.Types.ObjectId(post)

			Model.remove({author, post, type}, callback)
		},

		getByPostIds: (user, postIds, callback) => {
			let result = {}
			/* Yes, worthyS ... */
			for (let id of postIds) {
				result[id] = {
					youdid: {
						like: false,
						dislike: false,
						share: false,
                        smart: false,
                        worthy: false
					},
					reactions: {
						expert: {
							likes: 0,
							dislikes: 0,
							shares: 0,
							smarts: 0,
							worthys: 0
						},
						journalist: {
							likes: 0,
							dislikes: 0,
							shares: 0,
                            smarts: 0,
                            worthys: 0
						},
						user: {
							likes: 0,
							dislikes: 0,
							shares: 0,
                            smarts: 0,
                            worthys: 0
						},
                        total: {
                            likes: 0,
                            dislikes: 0,
                            shares: 0,
                            smarts: 0,
                            worthys: 0
                        }
					},
				}
			}

			postIds = postIds.map((id) => {
				if (typeof id !== 'object') return MOI(id)
				else return id
			})

			Model.find({post: {$in: postIds}}).populate('author').exec((err, reactions) => {
				for (let r of reactions) {
					if (r.author._id.toString() == user) {
						result[r.post.toString()].youdid[r.type] = true
					}

					result[r.post.toString()].reactions[r.author.role][`${r.type}s`]++
					result[r.post.toString()].reactions.total[`${r.type}s`]++
				}

				callback(err, result)
			})
		},

		getAllByPostOfType: (post, type, callback, lean) => {
			if (typeof post !== 'object') post = mongoose.Types.ObjectId(post)

			let query = Model.find({post, type}).populate('author')
			if (lean) query.lean()
			query.exec(callback)
		},

		getByPost: (user, post, callback) => {
			// if (typeof user !== 'object') user = mongoose.Types.ObjectId(user)
			if (typeof post !== 'object') post = mongoose.Types.ObjectId(post)

			Model.find({post}).populate('author').exec((err, reactions) => {
				if (err) return callback(err)

				let result = {
					youdid: {
						like: false,
						dislike: false,
						share: false,
                        smart: false,
                        worthy: false
					},
					reactions: {
                        expert: {
                            likes: 0,
                            dislikes: 0,
                            shares: 0,
                            smarts: 0,
                            worthys: 0
                        },
                        journalist: {
                            likes: 0,
                            dislikes: 0,
                            shares: 0,
                            smarts: 0,
                            worthys: 0
                        },
                        user: {
                            likes: 0,
                            dislikes: 0,
                            shares: 0,
                            smarts: 0,
                            worthys: 0
                        },
						total: {
                        	likes: 0,
							dislikes: 0,
							shares: 0,
							smarts: 0,
							worthys: 0
						}
                    },
				}

				for (let r of reactions) {
					if (r.author._id.toString() == user) {
						result.youdid[r.type] = true
					}

					result.reactions[r.author.role][`${r.type}s`]++
					result.reactions.total[`${r.type}s`]++
				}

				callback(err, result)
			})
		},

		getUserShares: (author, callback) => {
			if (typeof author !== 'object') author = mongoose.Types.ObjectId(author)

			Model.find({author, type: 'share'}).lean().exec(callback)
		},
		reactionsForUserToday: (user, type, callback) => {
			if (user !== 'object') user = mongoose.Types.ObjectId(user);
			models.Article.findArticlesAndPostsByUser(user, (err, posts) => {
				var ids = posts.map((post) => { return post._id });
				var now = new Date();
				var startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
				let query = Model.find({ post: { $in: ids }, type: type, createdAt: { $gte: startOfToday } })
					.populate([ { path: 'author' } ]);
				query.exec((err, records) => {
					return callback(err, records);
				});
			});
		},
		hasPostReactionsInLastWeek: (user, type, callback) => {
			if (user !== 'object') user = mongoose.Types.ObjectId(user);
			models.Article.findArticlesAndPostsByUser(user, (err, posts) => {
				var ids = posts.map((post) => { return post._id });
				var now = new Date();
				var endOfLastWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate());
				var startOfLastWeek = new Date(endOfLastWeek.getTime() - (7 * 24 * 60 * 60 * 1000));
				let query = Model.find({
					$and: [
						{
							post: { $in: ids },
							type: type,
						},
						{
							$and: [
								{ createdAt: { $gte: startOfLastWeek } },
								{ createdAt: { $lt: endOfLastWeek } },
							],
						},
					],
				});
				query.exec((err, records) => {
					let hasPostReactions = (records && records.length > 0);
					return callback(err, hasPostReactions);
				});
			});
		},
	}
}

module.exports = Model
