const 	express = require('express'),
		path = require('path'),
		async = require('async')

let router = express.Router();

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

router.post('/create',(req, res) => {
	var data = req.body;
	data.user = req.user.id;
	models.Book.create(data, function(err, response){
		console.log(err, response);
		if (err) res.send({ok:false}) 
		else {
			res.send({ok:true})
		}
	})
})




module.exports = router
