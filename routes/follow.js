const 	express = require('express'),
		path = require('path'),
		async = require('async')

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
				else res.send({isFollowing})
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
	let {following} = req.query

	models.Follow.followersByFollowing(following, (err, result) => {
		if (err) res.status(400).send(err)
		else res.send(result)
	})
})

router.get('/following', (req, res) => {
	let {follower} = req.query

	models.Follow.followingByFollower(follower, (err, result) => {
		if (err) res.status(400).send(err)
		else res.send(result)
	})
})

module.exports = router