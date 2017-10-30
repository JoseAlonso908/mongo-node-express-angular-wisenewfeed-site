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
			if (err || !user) res.status(400).send({message: 'User not found'})
			else {
				req.user = user
				next()
			}
		})
	}
})

router.post('/getbynamecity', (req, res)=>{	
	let {filtercity} = req.body;
	models.User.findByQuery({city:filtercity},(err, resultscuathanh) => {
		if (err) {
			res.status(500);
		} else {
			res.status(200).send(resultscuathanh)
		}
	})
})



module.exports = router
