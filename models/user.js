var Model = function(mongoose) {
	const sha1 = require('sha1')

	var schema = new mongoose.Schema({
		ObjectId	: mongoose.Schema.ObjectId,
		facebook	: String,
		linkedin	: String,
		twitter		: String,
		avatar		: String,
		name		: String,
		email		: String,
		password	: String,
		phone		: String,
		country		: String,
		position	: String,
	})

	var Model = mongoose.model('user', schema);

	return {
		findOne: (params, callback) => {
			Model.findOne(params, callback)
		},

		getByCredentials: (email, password, callback) => {
			password = sha1(password)

			Model.findOne({email, password}, callback)
		},

		findByEmail: (email, callback) => {
			Model.findOne({email}, callback)
		},

		createUser: (params, callback) => {
			if (params.password) params.password = sha1(params.password)

			let user = new Model()
			Object.assign(user, params)
			user.save(callback)
		},
	}
}

module.exports = Model