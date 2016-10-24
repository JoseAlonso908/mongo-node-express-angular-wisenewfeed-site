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
		role 		: String,
		title 		: String,
		company		: String,
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

		findByPhone: (phone, callback) => {
			Model.findOne({phone}, callback)
		},

		findByEmailOrPhone: (value, callback) => {
			Model.findOne({$or: [{email: value}, {phone: value}]}, callback)
		},

		createUser: (params, callback) => {
			if (params.password) params.password = sha1(params.password)
			if (!params.role) params.role = 'user'

			let user = new Model()
			Object.assign(user, params)
			user.save(callback)
		},

		updatePassword: (_id, password, callback) => {
			if (typeof _id !== 'object') _id = mongoose.Schema.Types.ObjectId(_id)

			Model.findOne({_id}, (err, user) => {
				user.password = sha1(password)
				user.save(callback)
			})
		}
	}
}

module.exports = Model