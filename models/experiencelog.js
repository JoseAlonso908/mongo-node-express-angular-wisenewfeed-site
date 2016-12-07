var Model = function(mongoose) {
	var schema = new mongoose.Schema({
		ObjectId	: mongoose.Schema.ObjectId,
		user		: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'user',
		},
		reward		: Number,
		post		: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'article',
		},
		comment		: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'comment',
		},
		type		: {
			type: String,
			enum: [
				'like', 'dislike', 'share', 'comment', 'follow',
			],
		},
		createdAt	: {type: Date, default: Date.now},
	})

	var Model = mongoose.model('experiencelog', schema);

	return {
		award: (user, reward, post, comment, type) => {
			
		},

		create: (to, from, post, comment, type, callback) => {
			if (typeof to !== 'object') to = mongoose.Types.ObjectId(to)
			if (typeof from !== 'object') from = mongoose.Types.ObjectId(from)
			if (typeof post !== 'object') post = mongoose.Types.ObjectId(post)
			if (typeof comment !== 'object') comment = mongoose.Types.ObjectId(comment)

			// Don't let notification to be sent to same user who made it
			if (to.toString() === from.toString()) {
				return callback()
			}

			let n = new Model()
			Object.assign(n, {to, from, post, comment, type})
			n.save(callback)
		},
	}
}

module.exports = Model