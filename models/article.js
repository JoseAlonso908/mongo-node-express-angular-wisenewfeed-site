var Model = function(mongoose) {
	var schema = new mongoose.Schema({
		ObjectId	: mongoose.Schema.ObjectId,
		author		: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'user',
		},
		images		: [String],
		text		: String,
		createdAt	: Date,
		comments	: [
			{
				author		: {
					type: mongoose.Schema.Types.ObjectId,
					ref: 'user',
				},
				createdAt	: Date,
				text		: String,
				likes		: Number,
				dislikes	: Number,
				images		: [String],
			}
		]
	})

	var Model = mongoose.model('article', schema);

	return {
		create: (author, text, images, callback) => {
			if (typeof author !== 'object') author = mongoose.Schema.Types.ObjectId(author)

			let article = new Model()
			Object.assign(article, {
				author, images, text,
				createdAt: (new Date()),
				commencts: [],
			})
			article.save(callback)
		},

		getByUser: (author, callback) => {
			if (typeof author !== 'object') author = mongoose.Schema.Types.ObjectId(author)

			Model.find({author}).select('-__v').populate('author').exec(callback)
		}
	}
}

module.exports = Model