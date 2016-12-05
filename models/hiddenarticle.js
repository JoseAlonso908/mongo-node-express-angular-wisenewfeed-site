var Model = function(mongoose) {
	var schema = new mongoose.Schema({
		ObjectId	: mongoose.Schema.ObjectId,
		article		: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'article',
		},
		user		: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'user',
		},
		createdAt	: {type: Date, default: Date.now},
	})

	var Model = mongoose.model('hiddenarticle', schema);

	return {
		hide: (article, user, callback) => {
			article = MOI(article)
			user = MOI(user)

			let item = new Model()
			Object.assign(item, {article, user})
			item.save(callback)
		},

		unhide: (article, user, callback) => {
			article = MOI(article)
			user = MOI(user)

			Model.remove({article, user}, callback)
		},

		isHiddenForUser: (article, user, callback) => {
			article = MOI(article)
			user = MOI(user)

			Model.findOne({article, user}, (err, item) => {
				callback(err, !!item)
			})
		},

		isHiddenForUserMulti: (articles, user, callback) => {
			articles = articles.map(MOI)
			user = MOI(user)

			Model.find({article: {$in: articles}, user}, (err, items) => {
				let result = {}

				if (!items) {
					return callback(err, result)
				}

				for (let i of items) {
					result[i.article.toString()] = true
				}

				callback(err, result)
			})
		},
	}
}

module.exports = Model