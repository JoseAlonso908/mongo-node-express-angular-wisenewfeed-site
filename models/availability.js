var Model = function(mongoose) {
	var schema = new mongoose.Schema({
		ObjectId	: mongoose.Schema.ObjectId,
		expert		: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'expert',
		},	
		userId:{
			type:String
		},
		availability:[{
			date: String,
			ranges:[],
			price: String,
			service: String

		}],
		createdAt	: {type: Date, default: Date.now},
	})

	var Model = mongoose.model('availability', schema);
	//CRUD 
	return {
		create: (data, callback) => {
				
			availability=data.availability;
			userId=data.userId;

			let item = new Model()
			Object.assign(item, {availability,userId})
			item.save(callback)
		},
		getavail: (callback) => {	
			Model.find().lean().exec(callback)		
		},

		getidavail: (query, callback) => {
			Model.find(query).lean().exec(callback)
					
		},

		updateAvail: (availability, _id , callback) => {
			
				
			Model.findOne({_id}, (err,availa ) => {
				Object.assign(availa, {availability})
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