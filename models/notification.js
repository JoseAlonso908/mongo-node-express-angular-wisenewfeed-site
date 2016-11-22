var Model = function(mongoose) {
	var schema = new mongoose.Schema({
		ObjectId	: mongoose.Schema.ObjectId,
		to			: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'user',
		},
		from		: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'user',
		},
		post		: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'article',
		},
		comment		: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'comment',
		},
		read 		: Boolean,
		type		: {
			type: String,
			enum: ['like', 'dislike', 'share', 'comment', 'follow'],
		},
		createdAt	: {type: Date, default: Date.now},
	})

	var Model = mongoose.model('notification', schema);

	return {
		create: (to, from, post, comment, type, callback) => {
			if (typeof to !== 'object') to = mongoose.Types.ObjectId(to)
			if (typeof from !== 'object') from = mongoose.Types.ObjectId(from)
			if (typeof post !== 'object') post = mongoose.Types.ObjectId(post)
			if (typeof comment !== 'object') comment = mongoose.Types.ObjectId(comment)

			let n = new Model()
			Object.assign(n, {to, from, post, comment, type})
			n.save(callback)
		},

		getForUserLean: (to, callback, skip = 0, limit = 10) => {
			if (typeof to !== 'object') to = mongoose.Types.ObjectId(to)

			Model.find({to}).populate('to from post comment').skip(skip).limit(limit).sort({createdAt: 'desc'}).lean().exec(callback)
		},
	}
}

module.exports = Model