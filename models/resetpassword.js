var Model = function(mongoose) {
	var schema = new mongoose.Schema({
		ObjectId	: mongoose.Schema.ObjectId,
		email		: String,
		token		: String,
		createdAt	: Date,

	})

	var Model = mongoose.model('resetpassword', schema);

	const randomString = require('random-string')

	return {
		createRequest: (email, callback) => {
			Model.findOne({email}, (err, result) => {
				if (result) return callback(err, result)
				else {
					let model = new Model()
					Object.assign(model, {
						email,
						token: randomString({length: 32})
					})
					model.save(callback)
				}
			})
		},

		validateRequest: (token, callback) => {
			Model.findOne({token}, (err, result) => {
				if (result) return callback(true)
				else return callback(false)
			})
		},

		getEmailByToken: (token, callback) => {
			Model.findOne({token}, (err, result) => {
				return callback(result.email)
			})
		},

		removeToken: (token, callback) => {
			Model.remove({token}, callback)
		}
	}
}

module.exports = Model