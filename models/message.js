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
		hiddenFrom	: {type: Boolean, default: false},
		hiddenTo	: {type: Boolean, default: false},
		read 		: {type: Boolean, default: false},
		createdAt	: {type: Date, default: Date.now},
	})

	var Model = mongoose.model('message', schema);

	return {
		send: (from, to, text, callback) => {
			from = MOI(from)
			to = MOI(to)

			let message = new Model()
			Object.assign(message, {from, to, text})
			message.save(callback)
		},

		getConversation: (user1, user2, callback) => {
			user1 = MOI(user1)
			user2 = MOI(user2)

			Model.find({$or: [
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
			]}).populate('from to').lean().sort({createdAt: 'desc'}).exec(callback)
		},
	}
}

module.exports = Model