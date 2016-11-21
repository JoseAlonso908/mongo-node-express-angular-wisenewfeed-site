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

		followingByFollower: (follower, callback) => {
			if (typeof follower !== 'object') follower = mongoose.Types.ObjectId(follower)

			Model.find({follower}).populate('following').exec(callback)
		},

		followersByFollowing: (following, callback) => {
			if (typeof following !== 'object') following = mongoose.Types.ObjectId(following)
			
			Model.find({following}).populate('follower').exec(callback)
		},
	}
}

module.exports = Model