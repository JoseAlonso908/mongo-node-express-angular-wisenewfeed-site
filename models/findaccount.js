var Model = function(mongoose) {
	var schema = new mongoose.Schema({
		ObjectId	: mongoose.Schema.ObjectId,
		email		: String,
		phone		: String,		
		code		: String,
		createdAt	: Date,

	})

	var Model = mongoose.model('findaccount', schema);

	const randomString = require('random-string')

	return {
		create: (valueObject, callback) => {
			valueObject.code = randomString({length: 8}).toUpperCase()

			var model = new Model()
			Object.assign(model, valueObject)
			model.save(callback)
		},

		findByCode: (code, callback) => {
			Model.findOne({code}, callback)
		}
	}
}

module.exports = Model