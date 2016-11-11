var Model = function(mongoose) {
	var schema = new mongoose.Schema({
		ObjectId	: mongoose.Schema.ObjectId,
		author		: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'user',
		},
		images		: [String],
		text		: String,
		createdAt	: {type: Date, default: Date.now},
		// ratings		: {
		// 	expert: {
		// 		likes: Number,
		// 		dislikes: Number,
		// 		shares: Number,
		// 	},
		// 	journalist: {
		// 		likes: Number,
		// 		dislikes: Number,
		// 		shares: Number,
		// 	},
		// 	visitor: {
		// 		likes: Number,
		// 		dislikes: Number,
		// 		shares: Number,
		// 	},
		// }
	})

	var Model = mongoose.model('article', schema);

	return {
		create: (author, text, images, callback) => {
			if (typeof author !== 'object') author = mongoose.Schema.Types.ObjectId(author)

			text = text.replace(/(\n|\r\n|\n\r)/g, '<br>')

			let article = new Model()
			Object.assign(article, {
				author, images, text,
				// ratings: {
				// 	expert: {likes: 0, dislikes: 0, shares: 0},
				// 	journalist: {likes: 0, dislikes: 0, shares: 0},
				// 	visitor: {likes: 0, dislikes: 0, shares: 0},
				// }
			})
			article.save(callback)
		},

		getAll: (callback) => {
			Model.find().select('-__v').populate('author').sort({createdAt: 'desc'}).exec(callback)
		},

		getByUser: (author, callback) => {
			if (typeof author !== 'object') author = mongoose.Types.ObjectId(author)

			Model.find({author}).select('-__v').populate('author').sort({createdAt: 'desc'}).exec(callback)
		},
	}
}

module.exports = Model