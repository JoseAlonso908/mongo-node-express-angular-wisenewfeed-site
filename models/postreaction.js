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
			enum: ['like', 'dislike', 'share'],
		},
		createdAt	: {type: Date, default: Date.now},
	})

	var Model = mongoose.model('postreaction', schema);

	return {
		find: (query, callback) => {
			Model.find(query).exec(callback)
		},

		react: (author, post, type, callback) => {
			if (typeof author !== 'object') author = mongoose.Types.ObjectId(author)
			if (typeof post !== 'object') post = mongoose.Types.ObjectId(post)

			Model.findOne({author, post, type}).lean().exec((err, existingReaction) => {
				if (!existingReaction) {
					let reaction = new Model()
					Object.assign(reaction, {author, post, type})
					reaction.save(callback)
				} else callback()
			})
		},

		unreact: (author, post, type, callback) => {
			if (typeof author !== 'object') author = mongoose.Types.ObjectId(author)
			if (typeof post !== 'object') post = mongoose.Types.ObjectId(post)

			Model.remove({author, post, type}, callback)
		},

		getByPostIds: (user, postIds, callback) => {
			let result = {}
			for (let id of postIds) {
				result[id] = {
					youdid: {
						like: false,
						dislike: false,
						share: false,
					},
					reactions: {
						expert: {
							likes: 0,
							dislikes: 0,
							shares: 0,
						},
						journalist: {
							likes: 0,
							dislikes: 0,
							shares: 0,
						},
						user: {
							likes: 0,
							dislikes: 0,
							shares: 0,
						},
					},
				}
			}

			postIds = postIds.map((id) => {
				if (typeof id !== 'object') return mongoose.Types.ObjectId(id)
				else return id
			})

			Model.find({post: {$in: postIds}}).populate('author').exec((err, reactions) => {
				for (let r of reactions) {
					if (r.author._id.toString() == user) {
						result[r.post.toString()].youdid[r.type] = true
					}

					result[r.post.toString()].reactions[r.author.role][`${r.type}s`]++
				}

				callback(err, result)
			})
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
					},
					reactions: {
						expert: {
							likes: 0,
							dislikes: 0,
							shares: 0,
						},
						journalist: {
							likes: 0,
							dislikes: 0,
							shares: 0,
						},
						user: {
							likes: 0,
							dislikes: 0,
							shares: 0,
						},
					},
				}

				for (let r of reactions) {
					if (r.author._id.toString() == user) {
						result.youdid[r.type] = true
					}

					result.reactions[r.author.role][`${r.type}s`]++
				}

				callback(err, result)
			})
		},
	}
}

module.exports = Model