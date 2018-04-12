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
				'create', 'like', 'dislike', 'share', 'comment', 'follow',
			],
		},
		createdAt	: {type: Date, default: Date.now},
	})

	var Model = mongoose.model('experiencelog', schema);

	return {
		award: (user, reward, post, comment, type, callback) => {
			user = MOI(user)
			post = MOI(post)
			comment = MOI(comment)

			let log = new Model()
			Object.assign(log, {user, reward, post, comment, type})
			log.save((err, result) => {
				models.User.findById(user, (err, user) => {
					user.xp += reward
					user.save(callback)
				})
			})
		},
	}
}

module.exports = Model