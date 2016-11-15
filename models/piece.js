const async = require('async')

var Model = function(mongoose) {
	var schema = new mongoose.Schema({
		ObjectId	: mongoose.Schema.ObjectId,
		title		: String,
		type		: {
			type: String,
			enum: ['tags', 'people', 'categories'],
		},
		amount		: Number,
		createdAt	: {type: Date, default: Date.now},
	})

	var Model = mongoose.model('piece', schema);

	return {
		addMulti: (pieces, callback) => {
			console.log(pieces)

			Model.collection.insert(pieces, callback)
		},

		clearAll: (callback) => {
			Model.remove({}, callback)
		},

		getTopGrouped: (callback) => {
			let result = {
				tags: [],
				people: [],
				categories: [],
			}

			async.series([
				(callback) => {
					Model.find({type: 'tags'}).sort({amount: 'desc'}).limit(10).exec((err, tags) => {
						result.tags = tags
						callback()
					})
				},
				(callback) => {
					Model.find({type: 'people'}).sort({amount: 'desc'}).limit(10).exec((err, people) => {
						result.people = people
						callback()
					})
				},
				(callback) => {
					Model.find({type: 'categories'}).sort({amount: 'desc'}).limit(10).exec((err, categories) => {
						result.categories = categories
						callback()
					})
				},
			], () => {
				callback(result)
			})
		},
	}
}

module.exports = Model