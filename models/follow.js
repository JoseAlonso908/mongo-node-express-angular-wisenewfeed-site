const async = require('async')

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
		createdAt	: {type: Date, default: Date.now},
		read 		: {type: Boolean, default: false},
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

		followingByFollower: (follower, skip, limit, sort, callback, lean) => {
			if (typeof follower !== 'object') follower = mongoose.Types.ObjectId(follower)

			let query = Model.find({follower}).populate('follower following')

			if (lean === true) query.lean()
			if (skip) query.skip(Number(skip))
			if (limit) query.limit(Number(limit))
			if (sort) query.sort(sort)

			query.exec((err, following) => {
				if (following && !sort) {
					following = following.sort((a, b) => {
						if (a.following.name > b.following.name) {
							return 1
						} else if (a.following.name < b.following.name) {
							return -1
						}

						return 0
					})
				}

				async.map(following, (f, next) => {
					async.parallel([
						(next) => {
							models.User.setXpInfo(f.follower, (err, follower) => {
								f.follower = follower
								next()
							})
						},
						(next) => {
							models.User.setXpInfo(f.following, (err, following) => {
								f.following = following
								next()
							})
						},
					], (err) => {
						next(null, f)
					})
				}, callback)
			})
		},

		followersByFollowing: (following, skip, limit, sort, callback, lean) => {
			if (typeof following !== 'object') following = mongoose.Types.ObjectId(following)

			let query = Model.find({following}).populate('follower following')

			if (lean === true) query.lean()
			if (skip) query.skip(Number(skip))
			if (limit) query.limit(Number(limit))
			if (sort) query.sort(sort)

			query.exec((err, followers) => {
				followers = followers.filter((f) => {
					if (!f.follower || !f.following) return false
					return true
				})

				if (followers && !sort) {
					followers = followers.sort((a, b) => {
						if (a.follower.name > b.follower.name) {
							return 1
						} else if (a.follower.name < b.follower.name) {
							return -1
						}

						return 0
					})
				}

				async.map(followers, (f, next) => {
					async.parallel([
						(next) => {
							models.User.setXpInfo(f.follower, (err, follower) => {
								f.follower = follower
								next()
							})
						},
						(next) => {
							models.User.setXpInfo(f.following, (err, following) => {
								f.following = following
								next()
							})
						},
					], (err) => {
						next(null, f)
					})
				}, callback)
			})
		},
        followedByUser: (user, options, callback) => {
            if (typeof user !== 'object') user = mongoose.Types.ObjectId(user)

            let query = Model.find({follower: user})

            if (options.lean === true) query.lean()
            if (options.skip) query.skip(Number(options.skip))
            if (options.limit) query.limit(Number(options.limit))
            if (options.sort) query.sort(options.sort)

            query.exec((err, records) => {
                let usersIDS = records.map(record => {
                    return record.following;
                })
                return callback(err, usersIDS)
            })

        },
		getUnreadForUser: (following, callback) => {
			Model.count({following, read: false}).exec(callback)
		},

		setReadAllForUser: (following, callback) => {
			Model.update({following}, {$set: {read: true}}, {multi: true}, callback)
		}
	}
}

module.exports = Model