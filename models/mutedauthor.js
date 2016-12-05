var Model = function(mongoose) {
	var schema = new mongoose.Schema({
		ObjectId	: mongoose.Schema.ObjectId,
		author		: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'user',
		},
		user		: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'user',
		},
		createdAt	: {type: Date, default: Date.now},
	})

	var Model = mongoose.model('mutedauthor', schema);

	return {
		mute: (author, user, callback) => {
			author = MOI(author)
			user = MOI(user)

			let item = new Model()
			Object.assign(item, {author, user})
			item.save(callback)
		},

		unmute: (author, user, callback) => {
			author = MOI(author)
			user = MOI(user)

			Model.remove({author, user}, callback)
		},

		getMutedByUser: (user, callback) => {
			user = MOI(user)

			Model.find({user}).populate('author').exec((err, mutes) => {
				let authors = mutes.map((m) => m.author)
				callback(err, authors)
			})
		},

		isMutedForUser: (author, user, callback) => {
			author = MOI(author)
			user = MOI(user)

			Model.findOne({author, user}, (err, item) => {
				callback(err, !!item)
			})
		},

		isMutedForUserMulti: (authors, user, callback) => {
			authors = authors.map(MOI)
			user = MOI(user)

			Model.find({author: {$in: authors}, user}, (err, items) => {
				let result = {}

				if (!items) {
					return callback(err, result)
				}

				for (let i of items) {
					result[i.author.toString()] = true
				}

				callback(err, result)
			})
		},
	}
}

module.exports = Model