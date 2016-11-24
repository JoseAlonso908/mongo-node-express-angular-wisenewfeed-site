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
			enum: [
				'like', 'dislike', 'share', 'comment', 'follow',
				'likeilike', 'dislikeilike', 'shareilike', 'commentilike',
				'likeicomment', 'dislikeicomment', 'shareicomment', 'commenticomment',
			],
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

			// Don't let notification to be sent to same user who made it
			// if (to.toString() === from.toString()) {
			// 	return callback()
			// }

			let n = new Model()
			Object.assign(n, {to, from, post, comment, type})
			n.save(callback)
		},

		getForUser: (to, settings, callback, lean, skip = 0, limit = 10) => {
			if (typeof to !== 'object') to = mongoose.Types.ObjectId(to)

			let query = Model.find({to}).populate('to from post comment').skip(skip).limit(limit).sort({createdAt: 'desc'})
			if (lean) query.lean()
			query.exec((err, notifications) => {
				if (err) res.status(400).send(err)

				notifications = notifications.filter((n) => {
					let keepIt = true

					// Skip notifications from experts
					if (!settings.expert && n.from.role === 'expert') keepIt = false

					// Skip notifications from journalists
					if (!settings.journalist && n.from.role === 'journalist') keepIt = false

					// Skip notifications about posts I liked
					if (!settings.liked && ['likeilike', 'dislikeilike', 'shareilike', 'commentilike'].indexOf(n.type) > -1) keepIt = false

					// Skip notifications about posts I reacted
					if (!settings.liked && ['likeicomment', 'dislikeicomment', 'shareicomment', 'commenticomment'].indexOf(n.type) > -1) keepIt = false

					return keepIt
				})

				callback(err, notifications)
			})
		},
	}
}

module.exports = Model