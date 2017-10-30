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
		timeTo: {
			type: String
		},		
		createdAt	: {type: Date, default: Date.now},
	})

	var Model = mongoose.model('book', schema);
	//CRUD 
	return {
		create: (data, callback) => {
			expert = MOI(data.expert)
			
			date = data.date
			timeFrom = data.timeFrom
			timeTo=data.timeTo

			let item = new Model()
			Object.assign(item, {expert,date, timeFrom,timeTo})
			item.save(callback)
		}
	}
}

module.exports = Model