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
	console.log('data222',data)
	models.Availability.create(data, function(err, response){
		// console.log(err, response);
		if (err) res.send({ok:false}) 
		else {
			res.send({ok:true})
		}
	})
})

router.post('/getavail', (req, res)=>{
	models.Availability.getavail((err, results) => {
		if (err) {
			res.status(500);
		} else {
			res.status(200).send(results)
		}
	})


})

router.post('/editavail', (req, res) => {
	var query = {};
	if(req.body.id){
		query._id=req.body.id
	}
	

	models.Availability.getidavail(query,(err, results) => {
		if (err) {
			res.status(500);
		} else {
			res.status(200).send(results)
		}
	})
})

router.post('/updateavail', (req, res) => {
	
	let  avail=req.body
	// let availability = req.body.availability;	
	console.log('sdasda',avail)
	if (avail) {
		models.Availability.updateAvail(avail, avail._id, () => {
			res.send({ok: true})
		})
	} else res.status(400).send({message: 'Invalid token'})
})

router.post('/removeavail', (req, res) => {
	let _id = req.body.id;

	models.Availability.removeAvailById(_id, (err, result)=>{
		if (err) res.status(400).send(err)
		else res.send({status: 'ok'});
	})
})
module.exports = router