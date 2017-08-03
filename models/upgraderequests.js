const async = require('async')

var Model = function(mongoose) {
	const sha1 = require('sha1')

	var schema = new mongoose.Schema({
		ObjectId: mongoose.Schema.ObjectId,
		user: String,
		facebook		: String,
		linkedin		: String,
		twitter			: String,
		facebookName	: String,
		linkedinName	: String,
		twitterName		: String,
		avatar			: {type: String, default: '/assets/images/avatar_placeholder.png'},
		wallpaper		: String,
		name			: String,
        nickname		: String,
		intro			: String,
		email			: String,
		password		: {type: String, select: false},
		phone			: String,
		country			: String,
		city 			: String,
		gender			: String,
		position		: String,
		company 		: String,
		field			: String,
		role 			: String,
		title 			: String,
		pdf: String,
		isBlocked: {
			type: Boolean,
			default: false
		},
		isAdmin: {
			type: Boolean,
			default: false
		},
		contact 		: {
			email: String,
			phone: String,
			skype: String,
			linkedin: String,
			fb: String,
		},
		certificates: [{
			filename	: String,
			filepath	: String,
		}],
		downloads: [{
			filename	: String,
			filepath	: String,
		}],
		experience	: [{
			time		: String,
			place		: String,
			description	: String,
		}],
		notifications: {
			expert 		: {type: Boolean, default: true},
			journalist 	: {type: Boolean, default: true},
			liked 		: {type: Boolean, default: true},
			reacted 	: {type: Boolean, default: true},
		},
		color 			: {type: String, default: 'bronze'},
		xp				: {type: Number, default: 0},
		xpInfo 			: {type: Object, default: {a: 1}},
		lastVisit		: Date,
	})


	var Model = mongoose.model('upgraderequest', schema);

	return {
		create: (data, callback) => {
			let request = new Model()
			Object.assign(request, data)
			request.save(callback)
		},
		getRequests: (callback) => {
			Model.find().exec(callback)
		},
		removeRequest: (id, callback) => {
			if (typeof id !== 'object') id = mongoose.Types.ObjectId(id)
			Model.findOneAndRemove({_id: id }).exec(callback);
		}
	}
}

module.exports = Model
