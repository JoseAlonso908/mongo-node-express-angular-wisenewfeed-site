const async = require('async')

var Model = function(mongoose) {
	var schema = new mongoose.Schema({
		ObjectId	: mongoose.Schema.ObjectId,
		from		: {
			type: mongoose.Schema.ObjectId,
			ref: 'user',
		},
		to			: {
			type: mongoose.Schema.ObjectId,
			ref: 'user',
		},
		text		: String,
		images		: [String],
		hiddenFor	: [{
			type: mongoose.Schema.ObjectId,
			ref: 'user',
		}],
		read 		: {type: Boolean, default: false},
		createdAt	: {type: Date, default: Date.now},
	})

	var Model = mongoose.model('message', schema);

	return {
		send: (from, to, text, images, callback) => {
			from = MOI(from)
			to = MOI(to)

			let message = new Model()
			Object.assign(message, {from, to, text, images})
			message.populate('from to').save((err, message) => {
				Model.populate(message, {path: "from to"}, callback)
			})
		},

		getConversations: (user, callback) => {
			user = MOI(user)

			Model.aggregate(
				{
					$match: {
						hiddenFor: {
							$nin: [user]
						}
					}
				},
				{
					$match: {
						$or: [{to: user}, {from: user}]
					}
				},
				{
					$sort: {
						createdAt: 1
					}
				},
				{
					$group: {
						id: {$last: "$_id"},
						_id: {from: "$from", to: "$to"},
						text: {$last: "$text"},
						images: {$last: "$images"},
						createdAt: {$last: "$createdAt"},
						read: {$last: "$read"},
					}
				},
				{
					$lookup: {
						from: 'users',
						localField: '_id.from',
						foreignField: '_id',
						as: 'from'
					},
				},
				{
					$lookup: {
						from: 'users',
						localField: '_id.to',
						foreignField: '_id',
						as: 'to'
					},
				}
			).exec((err, results) => {
				async.mapSeries(results, (c, next) => {
					async.series([
						(cb) => {
							models.User.setXpInfo(c.from[0], (err, user) => {
								c.from[0] = user
								cb()
							})
						},
						(cb) => {
							models.User.setXpInfo(c.to[0], (err, user) => {
								c.to[0] = user
								cb()
							})
						},
					], (err) => {
						next(null, c)
					})
				}, (err, results) => {
					results = results.filter((c) => {
						let cUsersJSON = JSON.stringify([c._id.from, c._id.to].sort())

						for (let c2 of results) {
							let c2UsersJSON = JSON.stringify([c2._id.from, c2._id.to].sort())

							if (cUsersJSON == c2UsersJSON && c.createdAt < c2.createdAt) return false
						}

						return true
					})

					if (results) {
						results = results.map((c) => {
							c._id = c.id

							c.from = c.from[0]
							c.to = c.to[0]

							return c
						})

						return callback(err, results)
					}

					return callback(err)
				})
			})
		},

		getConversation: (user1, user2, skip = 0, limit = 10, callback) => {
			user1 = MOI(user1)
			user2 = MOI(user2)

			skip = Number(skip)
			limit = Number(limit)

			Model.find({
				$and: [
					{
						$or: [
							{
								$and: [
									{from: user1},
									{to: user2},
								]
							},
							{
								$and: [
									{from: user2},
									{to: user1},
								]
							},
						]
					},
					{
						hiddenFor: {
							$nin: [user1]
						}
					}
				]
			}).populate('from to').sort({createdAt: 'desc'}).skip(skip).limit(limit).lean().exec(callback)
		},

		getByIdsLean: (ids, callback) => {
			ids = ids.map(MOI)
			Model.find({_id: {$in: ids}}).populate('from to').lean().exec(callback)
		},

		setRead: (user, ids, callback) => {
			ids = ids.map(MOI)
			Model.update({_id: {$in: ids}}, {$set: {read: true}}, {multi: true}, callback)
		},

		hideMessages: (user, ids, callback) => {
			ids = ids.map(MOI)
			Model.update({_id: {$in: ids}}, {$push: {hiddenFor: user}}, {multi: true}, callback)
		},

		getUnreadCountForUser: (user, callback) => {
			to = MOI(user)
			Model.count({to, read: false}, callback)
		},
	}
}

module.exports = Model