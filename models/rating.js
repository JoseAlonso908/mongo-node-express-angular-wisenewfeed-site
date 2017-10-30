var Model = function(mongoose) {
	var schema = new mongoose.Schema({
		ObjectId	: mongoose.Schema.ObjectId,
		expert		: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'expert',
		},
		user		: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'user',
		},
		rate: {
			type: Number
		},
		text: {
			type: String
		},
		createdAt	: {type: Date, default: Date.now},
	})

	var Model = mongoose.model('rating', schema);
	//CRUD 
	return {
		create: (data, callback) => {
			expert = MOI(data.expert)
			user = MOI(data.user)
			text = data.text
			rate = data.rate

			let item = new Model()
			Object.assign(item, {expert, user, text, rate})
			item.save(callback)
		},
		list :(_id,callback)=>{
			id = MOI(_id)
			Model.find({expert:id}).populate([
				{path: 'user'},
				
			]).lean().exec((err, ratings) => {
				callback(err, ratings)
			})
		}
	}
}

module.exports = Model