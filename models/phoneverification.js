var Model = function(mongoose) {
	var schema = new mongoose.Schema({
		ObjectId	: mongoose.Schema.ObjectId,
		code 		: String,
		phone		: String,
		createdAt	: Date,

	})

	var Model = mongoose.model('phoneverification', schema);

	const randomString = require('random-string')

	return {
		createCode: (phone, callback) => {
			let code = randomString({letters: false, length: 6})
			var model = new Model()
			Object.assign(model, {code, phone})
			model.save(callback)
		},

		verifyCode: (phone, code, callback) => {
			Model.findOne({phone, code}, (err, result) => {
				if (result) {
					Model.remove({phone, code}, (err, result) => {
						return callback(true)
					})
				} else {
					return callback(false)
				}
			})
		}
	}
}

module.exports = Model