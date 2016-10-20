var Model = function(mongoose) {
	var schema = new mongoose.Schema({
		ObjectId	: mongoose.Schema.ObjectId,
		facebook	: String,
		avatar		: String,
		name		: String,
		email		: String,
		position	: String,
	})

	var Model = mongoose.model('user', schema);

	return {
		findByFacebook: (facebook, callback) => {
			Model.findOne({facebook}, callback)
		},

		createUser: (params, callback) => {
			let user = new Model()
			Object.assign(user, params)
			user.save(callback)
		},
	}
}

module.exports = Model