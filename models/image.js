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

		createBunch: (author, filenames, callback) => {
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
	}
}

module.exports = model