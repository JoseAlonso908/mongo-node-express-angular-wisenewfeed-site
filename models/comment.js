var Model = function(mongoose) {
	var schema = new mongoose.Schema({
		ObjectId	: mongoose.Schema.ObjectId,
		author		: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'user',
		},
		post		: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'user',
		},
		text		: String,
		createdAt	: {type: Date, default: Date.now},
		likes		: {type: Number, default: 0},
		dislikes	: {type: Number, default: 0},
	})

	var Model = mongoose.model('comment', schema);

	return {
		addComment: (post, author, text, callback) => {
			if (typeof post !== 'object') post = mongoose.Types.ObjectId(post)
			if (typeof author !== 'object') author = mongoose.Schema.Types.ObjectId(author)

			let comment = new Model()
			Object.assign(comment, {
				author, post, text
			})

			comment.save(callback)
		}
	}
}

module.exports = Model