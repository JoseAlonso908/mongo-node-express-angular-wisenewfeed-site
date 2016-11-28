var Model = function(mongoose) {
	var schema = new mongoose.Schema({
		ObjectId	: mongoose.Schema.ObjectId,
		following	: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'user',
		},
		follower	: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'user',
		},
		createdAt	: Date,

	})

	var Model = mongoose.model('follow', schema);

	return {
		follow: (follower, following, callback) => {
			if (typeof follower !== 'object') follower = mongoose.Types.ObjectId(follower)
			if (typeof following !== 'object') following = mongoose.Types.ObjectId(following)

			// You can't follow yourself
			if (follower.toString() == following.toString()) {
				return callback()
			}

			Model.findOne({follower, following}).lean().exec((err, follow) => {
				if (follow || err) callback(err)
				else {
					let follow = new Model()
					Object.assign(follow, {
						follower, following
					})
					follow.save(callback)
				}
			})
		},

		unfollow: (follower, following, callback) => {
			if (typeof follower !== 'object') follower = mongoose.Types.ObjectId(follower)
			if (typeof following !== 'object') following = mongoose.Types.ObjectId(following)

			Model.remove({follower, following}, callback)
		},

		isFollowing: (follower, following, callback) => {
			if (typeof follower !== 'object') follower = mongoose.Types.ObjectId(follower)
			if (typeof following !== 'object') following = mongoose.Types.ObjectId(following)

			Model.findOne({follower, following}).lean().exec((err, follow) => {
				callback(err, !!follow)
			})
		},

		followingByFollower: (follower, callback, lean) => {
			if (typeof follower !== 'object') follower = mongoose.Types.ObjectId(follower)

			let query = Model.find({follower}).populate('follower following')
			if (lean === true) query.lean()
			query.exec(callback)
		},

		followersByFollowing: (following, callback, lean) => {
			if (typeof following !== 'object') following = mongoose.Types.ObjectId(following)

			let query = Model.find({following}).populate('follower following')
			if (lean === true) query.lean()
			query.exec(callback)
		},
	}
}

module.exports = Model