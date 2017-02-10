const async = require('async')

var model = function (mongoose) {
	var schema = new mongoose.Schema({
		ObjectId	: mongoose.Schema.ObjectId,
		author		: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'user',
		},
		filename	: String,
		privacy		: {type: String, default: 'public'},
	})

	var Model = mongoose.model('image', schema)

	return {
		Model,

		create: (author, filename, callback) => {
			author = MOI(author)

			let image = new Model()
			Object.assign(image, {author, filename})
			image.save(callback)
		},

		createBunch: (author, filenames, privacy, callback) => {
			if (typeof privacy == 'function') {
				callback = privacy
			}

			author = MOI(author)

			let ids = []

			async.eachSeries(filenames, (filename, next) => {
				let image = new Model()
				Object.assign(image, {author, filename})
				image.save((err, image) => {
					ids.push(image._id)
					next()
				})
			}, (err) => {
				callback(err, ids)
			})
		},

		imagesOfUser: (author, callback) => {
			author = MOI(author)
			Model.find({author}).populate('author').lean().exec(callback)
		},

		remove: (author, id, callback) => {
			author = MOI(author)
			_id = MOI(id)

			Model.remove({_id, author}, callback)
		},

		setPrivacy: (author, id, privacy, callback) => {
			author = MOI(author)
			_id = MOI(id)

			Model.findOne({_id, author}).exec((err, image) => {
				if (!image) return callback({message: 'Image does not exist'})

				Object.assign(image, {privacy})

				image.save(callback)
			})
		},
	}
}

module.exports = model