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

	var Model = mongoose.model('report', schema);

	return {
		report: (article, user, callback) => {
			article = MOI(article)
			user = MOI(user)

			let item = new Model()
			Object.assign(item, {article, user})
			item.save(callback)
		},
	}
}

module.exports = Model