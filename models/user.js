var Model = function(mongoose) {
	const sha1 = require('sha1')

	var schema = new mongoose.Schema({
		ObjectId	: mongoose.Schema.ObjectId,
		facebook	: String,
		linkedin	: String,
		twitter		: String,
		avatar		: String,
		wallpaper	: String,
		name		: String,
		intro		: String,
		email		: String,
		password	: String,
		phone		: String,
		country		: String,
		position	: String,
		role 		: String,
		title 		: String,
		company		: String,
		contact 	: {
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
		}]
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

		setAvatar: (_id, avatar, callback) => {
			if (typeof _id !== 'object') _id = mongoose.Schema.Types.ObjectId(_id)

			Model.findOne({_id}, (err, user) => {
				Object.assign(user, {avatar})
				user.save(callback)
			})
		},

		setWallpaper: (_id, wallpaper, callback) => {
			if (typeof _id !== 'object') _id = mongoose.Schema.Types.ObjectId(_id)

			Model.findOne({_id}, (err, user) => {
				Object.assign(user, {wallpaper})
				user.save(callback)
			})
		},

		addCertificate: (_id, filename, filepath, callback) => {
			if (typeof _id !== 'object') _id = mongoose.Schema.Types.ObjectId(_id)

			Model.findOne({_id}, (err, user) => {
				user.certificates.push({filename, filepath})
				user.save(callback)
			})
		},

		getCertificateByName: (_id, filename, callback) => {
			if (typeof _id !== 'object') _id = mongoose.Schema.Types.ObjectId(_id)

			Model.findOne({_id}, (err, user) => {
				for (let cert of user.certificates) {
					if (cert.filename === filename) {
						return callback(cert)
					}
				}
			})
		},

		removeCertificateByName: (_id, filename, callback) => {
			if (typeof _id !== 'object') _id = mongoose.Schema.Types.ObjectId(_id)

			Model.findOne({_id}, (err, user) => {
				user.certificates = user.certificates.filter((cert) => {
					return cert.filename != filename
				})
				user.save(callback)
			})
		},

		addDownload: (_id, filename, filepath, callback) => {
			if (typeof _id !== 'object') _id = mongoose.Schema.Types.ObjectId(_id)

			Model.findOne({_id}, (err, user) => {
				user.downloads.push({filename, filepath})
				user.save(callback)
			})
		},

		getDownloadByName: (_id, filename, callback) => {
			if (typeof _id !== 'object') _id = mongoose.Schema.Types.ObjectId(_id)

			Model.findOne({_id}, (err, user) => {
				for (let cert of user.downloads) {
					if (cert.filename === filename) {
						return callback(cert)
					}
				}
			})
		},

		removeDownloadByName: (_id, filename, callback) => {
			if (typeof _id !== 'object') _id = mongoose.Schema.Types.ObjectId(_id)

			Model.findOne({_id}, (err, user) => {
				user.downloads = user.downloads.filter((file) => {
					return file.filename != filename
				})
				user.save(callback)
			})
		},

		updatePassword: (_id, password, callback) => {
			if (typeof _id !== 'object') _id = mongoose.Schema.Types.ObjectId(_id)

			Model.findOne({_id}, (err, user) => {
				user.password = sha1(password)
				user.save(callback)
			})
		},

		updateProfile: (_id, contact, experience, intro, name, callback) => {
			if (typeof _id !== 'object') _id = mongoose.Schema.Types.ObjectId(_id)

			Model.findOne({_id}, (err, user) => {
				Object.assign(user, {contact, experience, intro, name})
				user.save(callback)
			})
		}
	}
}

module.exports = Model