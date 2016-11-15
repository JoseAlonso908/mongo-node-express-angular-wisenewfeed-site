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

	var Model = mongoose.model('comment', schema);

	return {
		addMulti: (pieces, callback) => {
			Model.collection.insert(pieces, callback)
		},

		clearAll: (callback) => {
			Model.remove({}, callback)
		}
	}
}

module.exports = Model