const 	express = require('express'),
		path = require('path'),
		async = require('async'),
		config = require('./../config')

let router = express.Router()

router.use((req, res, next) => {
	if (!req.headers.authorization) {
		res.status(400).send({message: 'Invalid token'})
	} else {
		req.access_token = req.headers.authorization.split(' ')[1]

		models.Token.getUserByToken(req.access_token, (err, user) => {
			req.user = user
			next()
		})
	}
})

router.get('/isFollowing', (req, res) => {
	let {following} = req.query

	models.Follow.isFollowing(req.user._id, following, (err, isFollowing) => {
		if (err) res.status(400).send(err)
		else res.send({isFollowing})
	})
})

router.post('/follow', (req, res) => {
	let {following} = req.body

	models.Follow.follow(req.user._id, following, (err, result) => {
		if (err) res.status(400).send(err)
		else {
			models.Follow.isFollowing(req.user._id, following, (err, isFollowing) => {
				if (err) res.status(400).send(err)
				else {
					async.series({
						rewardFollowee: function (next) {
							models.ExperienceLog.award(req.user._id, config.EXP_REWARDS.FOLLOW.following, null, null, 'follow', next)
						},
						rewardFollowing: function (next) {
							models.ExperienceLog.award(following, config.EXP_REWARDS.FOLLOW.follower, null, null, 'follow', next)
						},
						notification: function (next) {
							// Add following notification
							models.Notification.create(following, req.user._id, null, null, 'follow', next)
						}
					}, (err) => {
						res.send({isFollowing})
					})
				}
			})
		}
	})
})

router.post('/unfollow', (req, res) => {
	let {following} = req.body

	models.Follow.unfollow(req.user._id, following, (err, result) => {
		if (err) res.status(400).send(err)
		else {
			models.Follow.isFollowing(req.user._id, following, (err, isFollowing) => {
				if (err) res.status(400).send(err)
				else res.send({isFollowing})
			})
		}
	})
})

router.get('/followers', (req, res) => {
	let {following, skip, limit, sort} = req.query

	if (sort) {
		let sortParts = sort.split('|')
		sort = {}
		sort[sortParts[0]] = sortParts[1]
	}

	models.Follow.followersByFollowing(following, skip, limit, sort, (err, followers) => {
		if (err) res.status(400).send(err)
		else {
			models.Follow.followingByFollower(req.user._id, null, null, null, (err, following) => {
				followers = followers.map((follower) => {
					for (let followee of following) {
						if (follower.follower._id.toString() === followee.following._id.toString()) {
							follower.isFollowing = true
							break
						}
					}

					return follower
				})

				res.send(followers)
			}, true)
		}
	}, true)
})

router.get('/following', (req, res) => {
	let {follower, skip, limit, sort} = req.query

	if (sort) {
		let sortParts = sort.split('|')
		sort = {}
		sort[sortParts[0]] = sortParts[1]
	}

	models.Follow.followingByFollower(follower, skip, limit, sort, (err, following) => {
		if (err) res.status(400).send(err)
		else res.send(following)
	})
})

router.get('/unread', (req, res) => {
	models.Follow.getUnreadForUser(req.user._id, (err, count) => {
		if (err) res.status(400).send(err)
		else res.send({count})
	})
})

router.post('/setreadall', (req, res) => {
	models.Follow.setReadAllForUser(req.user._id, (err, result) => {
		if (err) res.status(400).send(err)
		else res.send({ok: true})
	})
})

module.exports = router