const 	express = require('express'),
		multer = require('multer'),
		path = require('path'),
		async = require('async'),
		config = require('./../config')

let tempUploads = multer({dest: 'temp/'})
let router = express.Router()

router.use((req, res, next) => {
	if (!req.headers.authorization) {
		res.status(400).send({message: 'Invalid token'})
	} else {
		req.access_token = req.headers.authorization.split(' ')[1]

		models.Token.getUserByToken(req.access_token, (err, user) => {
			req.user = user
			if (req.user.isAdmin) {
				next();
			} else {
				res.status(403).send({message: 'Your are not admin'});
			}
		})
	}
})

router.post('/getrequests', (req, res)=>{
	models.Upgraderequests.getRequests((err, results)=>{
		if (err) return res.status(500).send(err)
		res.send(results)
	})
})

router.post('/getexperts', (req, res)=>{
	let {q, start, limit} = req.body;

	let role = 'expert'

	models.User.adminSearch(req.user._id, q, role, start, limit, false, (err, results) => {
		if (err) res.status(400).send(err)
		else res.send(results)
	})
})

router.post('/removeuser', (req, res) => {
	let _id = req.body.id;

	models.User.removeUserById(_id, (err, result)=>{
		if (err) res.status(400).send(err)
		else res.send({status: 'ok'});
	})
})

router.post('/blockuser', (req, res) => {
	let _id = req.body.id;

	models.User.blockUserById(_id, (err, result)=>{
		if (err) res.status(400).send(err)
		else res.send({status: 'ok'});
	})
})

router.post('/downgrade', (req, res) => {
	let id = req.body.id;
	models.User.update(req.body.id,{role:'user'}, (err, result)=>{
		if (err) res.status(400).send(err)
		else res.send(result) 
	})
})

router.post('/remove', (req, res) => {
	let id = req.body.id;
	models.User.update(req.body.id,{role:'user'}, (err, result)=>{
		if (err) res.status(400).send(err)
		else res.send(results) 
	})
})

router.post('/upgradeexpert', (req, res) => {
	let id = req.body.id;
	let role = 'expert';
	models.User.update(id, {role}, (err, user) => {
		if (err) res.status(400).send(err)
		else {
			mailgun.sendText(`service@${config.MAILGUN.SANDBOX_DOMAIN}`, [user.email],
				`Your WNF profile was approved!`,
				`Congratulations! Your WiseNewsFeed profile was upgraded to ${role}!`,
				err => res.send(err)
			)
        }
	})
})

router.post('/denyexpert', (req, res) => {
	let userId = req.body.userId;
	let id = req.body._id;
	let role = 'expert';
	models.User.findById(userId, (err, user) => {
		if (!user) {
			return res.send({message: 'User not found'})
		}

		models.Upgraderequests.removeRequest(id,(err, result)=>{
			if (err) res.send(err)
			else {
				mailgun.sendText(`service@${config.MAILGUN.SANDBOX_DOMAIN}`, [user.email],
		            `Your WNF profile was declined`,
		            `Unfortunately, your WiseNewsFeed profile was declined.`,
		            err => res.send(err)
		        )
			}
		})


		mailgun.sendText(`service@${config.MAILGUN.SANDBOX_DOMAIN}`, [user.email],
            `Your WNF profile was declined`,
            `Unfortunately, your WiseNewsFeed profile was declined.`,
            (err) => {
            	if (err) return res.send(err)
            	res.send({status: 'ok'})	
            }
        )
	})
})

module.exports = router
