var Model = function(mongoose) {
	var schema = new mongoose.Schema({
		ObjectId	: mongoose.Schema.ObjectId,
		blocked		: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'user',
		},
		user		: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'user',
		},
		createdAt	: {type: Date, default: Date.now},
	})

	var Model = mongoose.model('blockeduser', schema);

	return {
		block: (blocked, user, callback) => {
			blocked = MOI(blocked)
			user = MOI(user)

			let item = new Model()
			Object.assign(item, {blocked, user})
			item.save(callback)
		},

		unblock: (blocked, user, callback) => {
			blocked = MOI(blocked)
			user = MOI(user)

			Model.remove({blocked, user}, callback)
		},

		getBlockedByUser: (user, callback) => {
			user = MOI(user)

			Model.find({user}).populate('blocked').exec((err, mutes) => {
				let blockeds = mutes.map((m) => m.blocked)
				callback(err, blockeds)
			})
		},

		isBlockedForUser: (blocked, user, callback) => {
			blocked = MOI(blocked)
			user = MOI(user)

			Model.findOne({blocked, user}, (err, item) => {
				callback(err, !!item)
			})
		},

		isBlockedForUserMulti: (blockeds, user, callback) => {
			blockeds = blockeds.map(MOI)
			user = MOI(user)

			Model.find({blocked: {$in: blockeds}, user}, (err, items) => {
				let result = {}

				if (!items) {
					return callback(err, result)
				}

				for (let i of items) {
					result[i.blocked.toString()] = true
				}

				callback(err, result)
			})
		},
	}
}

module.exports = Model