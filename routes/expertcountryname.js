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

router.post('/getbynamecountry', (req, res)=>{	
	let {filtercountry} = req.body;
	models.User.findByQuery({country:filtercountry},(err, resultscuathanh) => {
		if (err) {
			res.status(500);
		} else {
			res.status(200).send(resultscuathanh)
		}
	})
})



module.exports = router
