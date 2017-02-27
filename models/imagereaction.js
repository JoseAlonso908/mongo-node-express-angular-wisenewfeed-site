const async = require('async')

var Model = function(mongoose) {
	var schema = new mongoose.Schema({
		ObjectId	: mongoose.Schema.ObjectId,
		author		: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'user',
		},
		image		: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'image',
		},
		type		: {
			type: String,
			enum: ['like', 'love'],
		},
		createdAt	: {type: Date, default: Date.now},
	})

	var Model = mongoose.model('imagereaction', schema);

	return {
		Model,

		find: (query, callback) => {
			Model.find(query).exec(callback)
		},

		findLean: (query, callback) => {
			Model.find(query).lean().exec(callback)
		},

		react: (author, image, type, callback) => {
			if (typeof author !== 'object') author = MOI(author)
			if (typeof image !== 'object') image = MOI(image)

			Model.find({author, image}).lean().exec((err, existingReactions) => {
				// Check for reaction with same type
				let sameTypeExist = false

				for (let reaction of existingReactions) {
					if (reaction.type == type) {
						sameTypeExist = true
					}
				}

				async.series([
					(callback) => {
						if (!sameTypeExist) {
							let reaction = new Model()
							Object.assign(reaction, {author, image, type})
							reaction.save(callback)
						} else return callback()
					}
				], (err) => {
					callback()
				})
			})
		},

		unreact: (author, image, type, callback) => {
			if (typeof author !== 'object') author = mongoose.Types.ObjectId(author)
			if (typeof image !== 'object') image = mongoose.Types.ObjectId(image)

			Model.remove({author, image, type}, callback)
		},

		getByImageIds: (user, imageIds, callback) => {
			let result = {}
			/* Yes, worthyS ... */
			for (let id of imageIds) {
				result[id] = {
					youdid: {
						like: false,
						love: false,
					},
					reactions: {
						likes: 0,
						loves: 0,
					},
				}
			}

			imageIds = imageIds.map((id) => {
				if (!id) return
				if (typeof id !== 'object') return MOI(id)
				else return id
			})

			Model.find({image: {$in: imageIds}}).exec((err, reactions) => {
				for (let r of reactions) {
					if (r.author.toString() == user) {
						result[r.image.toString()].youdid[r.type] = true
					}

					result[r.image.toString()].reactions[`${r.type}s`]++
				}

				callback(err, result)
			})
		},

		getAllByImageOfType: (image, type, callback, lean) => {
			image = MOI(image)

			let query = Model.find({image, type}).populate('author')
			if (lean) query.lean()
			query.exec(callback)
		},

		getByImage: (user, image, callback) => {
			user = MOI(user)
			image = MOI(image)

			Model.find({image}).populate('author').exec((err, reactions) => {
				if (err) return callback(err)

				let result = {
                    youdid: {
                        like: false,
                        love: false,
                    },
                    reactions: {
						likes: 0,
						loves: 0,
                    },
				}

				for (let r of reactions) {
					if (r.author.toString() == user) {
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