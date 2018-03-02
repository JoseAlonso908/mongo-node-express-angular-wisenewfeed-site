var Model = function(mongoose) {
	var schema = new mongoose.Schema({
		ObjectId	: mongoose.Schema.ObjectId,
		expert		: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'expert',
		},
		date:{
			type:String
		},
		timeFrom: {
			type: String
		},
		service: {
			type:String
		},
		price: {
			type:String
		},
		createdAt	: {type: Date, default: Date.now},
	})

	var Model = mongoose.model('availability', schema);
	//CRUD 
	return {
		create: (data, callback) => {
				
			
			date = data.date
			timeFrom = data.timeFrom
			service=data.service,
			price=data.price

			let item = new Model()
			Object.assign(item, {date,timeFrom,service,price})
			item.save(callback)
		},
		getavail: (callback) => {	
			Model.find().lean().exec(callback)		
		},

		getidavail: (query, callback) => {
			Model.find(query).lean().exec(callback)
					
		},

		updateAvail: (availbook, _id , callback) => {
			
			console.log('thu1',availbook)
			Model.findOne({_id}, (err,availa) => {
				Object.assign(availa,availbook)
				console.log('thu2',availa)	
				availa.save(callback)
			})
		},
		removeAvailById : (_id, callback) => {
			_id = MOI(_id)

			Model.findOneAndRemove({_id},callback);
		},
	}
}

module.exports = Model