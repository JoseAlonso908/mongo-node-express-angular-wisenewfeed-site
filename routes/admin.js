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
			} else if (config.ADMIN_EMAILS.indexOf(req.user.email)>0){
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

router.post('/unblockuser', (req, res) => {
	let _id = req.body.id;

	models.User.unblockUserById(_id, (err, result)=>{
		if (err) res.status(400).send(err)
		else res.send({status: 'ok'});
	})
})

router.post('/downgrade', (req, res) => {
	let id = req.body.id;
	models.User.update(req.body.id,{role:'user'}, (err, result)=>{
		if (err) res.status(400).send(err)
		else {
			models.Notification.create(id,req.user._id,null,null,'downgrade',(err, result)=>{
				if (err) res.status(400).send(err)
				else res.send({status: 'ok'});	
			})
		}
			
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
	let id = req.body.user;
	console.log(req.body);
	let reqId = req.body.id;
	let role = 'expert';
	models.User.update(id, {role}, (err, user) => {
		if (err) res.status(400).send(err)
		else {
			models.Upgraderequests.removeRequest(reqId,(err, result)=>{
				if (err) {
					res.status(400).send(err);
				} else {
					models.Notification.create(id,req.user._id,null,null,'approveupgrade',(err, result)=>{
						if (err) res.status(400).send(err)
						else res.send({status: 'ok'});	
					})
				}
			})

        }
	})
})

router.post('/denyexpert', (req, res) => {
	let userId = req.body.user;
	let id = req.body.id;
	let role = 'expert';
	models.Upgraderequests.removeRequest(id,(err, result)=>{
		if (err) res.send(err)
		else {
			models.Notification.create(userId,req.user._id,null,null,'denyupgrade',(err, result)=>{
				if (err) res.status(400).send(err)
				else res.send({status: 'ok'});	
			})
		}
	})

})

module.exports = router
