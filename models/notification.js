const async = require('async')

var Model = function(mongoose) {
	var schema = new mongoose.Schema({
		ObjectId	: mongoose.Schema.ObjectId,
		to			: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'user',
			index: true,
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
		read 		: {type: Boolean, default: false, index: true},
		type		: {
			type: String,
			enum: [
				'like', 'dislike', 'share', 'comment', 'follow',
				'likeilike', 'dislikeilike', 'shareilike', 'commentilike',
				'likeicomment', 'dislikeicomment', 'shareicomment', 'commenticomment',
				'friendshipnew', 'questionnew', 'mentioned', 'mentionedcomment'
			],
		},
		createdAt	: {type: Date, default: Date.now},
	})
	schema.index({to: 1})

	var Model = mongoose.model('notification', schema);

	return {
		create: (to, from, post, comment, type, callback) => {
			to = MOI(to)
			from = MOI(from)
			post = MOI(post)
			comment = MOI(comment)

			// Don't let notification to be sent to same user who made it
			if (to.toString() == from.toString()) {
				return callback()
			}

			let n = new Model()
			Object.assign(n, {to, from, post, comment, type})
			n.save(callback)
		},

		getForUser: (to, settings, callback, lean, skip = 0, limit = 10) => {
			to = MOI(to)

			let query = Model.find({to}).populate('to from post comment').skip(skip).limit(limit).sort({createdAt: 'desc'})
			if (lean) query.lean()
			query.exec((err, notifications) => {
				if (err) return res.status(400).send(err)

				notifications = notifications.filter((n) => {
					let keepIt = true
					if (!n.from) keepIt = false
					if (['like', 'dislike', 'share', 'comment', 'follow'].indexOf(n.type) > -1 && !n.post && !n.comment) keepIt = false
					if (!n.post && ['mentioned', 'mentionedcomment'].indexOf(n.type) > -1) keepIt = false
					return keepIt
				})

				async.mapSeries(notifications, (n, next) => {
					if (!n.from.xpInfo) {
						models.User.setXpInfo(n.from, (err, user) => {
							n.from = user
							next(null, n)
						})
					} else {
						next(null, n)
					}
				}, callback)
			})
		},

		getUnreadCountForUser: (to, callback) => {
			if (typeof to !== 'object') to = MOI(to)

			Model.count({to, read: false}).exec(callback)
		},

		setReadAllForUser: (to, callback) => {
			if (typeof to !== 'object') to = MOI(to)

			Model.update({to}, {$set: {read: true}}, {multi: true}, callback)
		},

		setReadForUser: (ids, to, callback) => {
			if (typeof to !== 'object') to = MOI(to)
			ids = ids.map((id) => {
				return (typeof id !== 'object') ? MOI(id) : id
			})

			Model.update({_id: {$in: ids}, to}, {$set: {read: true}}, {multi: true}, callback)
		}
	}
}

module.exports = Model