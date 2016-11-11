var Model = function(mongoose) {
	var schema = new mongoose.Schema({
		ObjectId	: mongoose.Schema.ObjectId,
		user		: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'user',
		},
		token		: String,
		createdAt	: Date,

	})

	var Model = mongoose.model('token', schema);

	const randomString = require('random-string')

	return {
		createToken: (user, callback) => {
			if (typeof user !== 'object') user = mongoose.Schema.Types.ObjectId(user)

			Model.findOne({user}, (err, token) => {
				if (token) callback(err, token)
				else {
					var token = new Model()
					Object.assign(token, {
						user,
						token: randomString({length: 32})
					})
					token.save(callback)
				}
			})
		},

		getUserByToken: (token, callback) => {
			Model.findOne({token}).populate('user').exec((err, result) => {
				if (result && result.user) {
					callback(err, result.user)
				} else {
					callback(err, false)
				}
			})
		}
	}
}

module.exports = Model