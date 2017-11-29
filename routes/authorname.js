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

router.post('/getbynameauthor', (req, res)=>{	
	let {item} = req.body;
	var query = {};

	if(item) {
		query.username = {$regex: new RegExp(item), $options: '-i'};
	}

	// if(filtercountry) {
	// 	query.country = filtercountry;
	// }

	// if(filtercategory) {
	// 	query.categories = {$regex: new RegExp(filtercategory), $options: '-i'};
	// }

	// {city: filtercity}
	models.User.findByQuery(query,(err, resultscuathanh) => {
		if (err) {
			res.status(500);
		} else {
			res.status(200).send(resultscuathanh)
		}
	})
})



module.exports = router