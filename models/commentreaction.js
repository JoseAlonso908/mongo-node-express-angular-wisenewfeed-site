const async = require('async')

var Model = function(mongoose) {
	var schema = new mongoose.Schema({
		ObjectId	: mongoose.Schema.ObjectId,
		author		: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'user',
		},
		comment		: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'comment',
		},
		type		: {
			type: String,
			enum: ['like', 'dislike'],
		},
		createdAt	: {type: Date, default: Date.now},
	})

	var Model = mongoose.model('commentreaction', schema);

	return {
		find: (query, callback) => {
			Model.find(query).exec(callback)
		},
		
		react: (author, comment, type, callback) => {
			if (typeof author !== 'object') author = mongoose.Types.ObjectId(author)
			if (typeof comment !== 'object') comment = mongoose.Types.ObjectId(comment)

			Model.find({author, comment}).lean().exec((err, existingReactions) => {
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
							Object.assign(reaction, {author, comment, type})
							reaction.save(callback)
						} else return callback()
					}
				], (err) => {
					callback()
				})
			})
		},

		unreact: (author, comment, type, callback) => {
			if (typeof author !== 'object') author = mongoose.Types.ObjectId(author)
			if (typeof comment !== 'object') comment = mongoose.Types.ObjectId(comment)

			Model.remove({author, comment, type}, callback)
		},

		getByCommentIds: (user, commentIds, callback) => {
			let result = {}
			for (let id of commentIds) {
				result[id] = {
					youdid: {
						like: false,
						dislike: false,
					},
					reactions: {
						likes: 0,
						dislikes: 0,
					},
				}
			}

            commentIds = commentIds.filter(id => {
                return (id && id != ' ')
            }).map((id) => {
				if (typeof id !== 'object') return mongoose.Types.ObjectId(id)
			})

			Model.find({comment: {$in: commentIds}}).populate('author', '-password').exec((err, reactions) => {
				for (let r of reactions) {
					if (!r || !r.author) continue
					if (r.author._id.toString() == user) {
						result[r.comment.toString()].youdid[r.type] = true
					}

					result[r.comment.toString()].reactions[`${r.type}s`]++
				}

				callback(err, result)
			})
		},

		getByComment: (user, comment, callback) => {
			// if (typeof user !== 'object') user = mongoose.Types.ObjectId(user)
			if (typeof comment !== 'object') comment = mongoose.Types.ObjectId(comment)

			Model.find({comment}).populate('author', '-password').exec((err, reactions) => {
				if (err) return callback(err)

				let result = {
					youdid: {
						like: false,
						dislike: false,
					},
					reactions: {
						likes: 0,
						dislikes: 0,
					},
				}

				for (let r of reactions) {
					if (r.author._id.toString() == user) {
						result.youdid[r.type] = true
					}

					result.reactions[`${r.type}s`]++
				}

				callback(err, result)
			})
		},
	}
}

module.exports = Model