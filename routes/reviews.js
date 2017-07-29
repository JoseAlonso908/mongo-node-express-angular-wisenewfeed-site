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

router.post('/create', (req, res) => {
	let review = {
		rating: req.body.rating,
		expert: req.body.expert,
		text: req.body.text,
		user: req.user._id
	};


	models.Reviews.createReviews(review,(err, response) => {
		if (err) res.status(400).send(err) 
		else res.send({ok: true, response: response});
	})
})

router.post('/expertreviews',(req, res) => {
	let params = {expert: req.body.expert};

	models.Reviews.findByExpertId(params,(err, response)=>{
		if (err) res.status(400).send(err)
		else res.send({ok:true, response: response});	
	})
})



module.exports = router