

var Model = function(mongoose) {
	const sha1 = require('sha1')

	var schema = new mongoose.Schema({
		ObjectId: mongoose.Schema.ObjectId,
		rating: Number,
		expert: String,
		text: String
	})


	var Model = mongoose.model('reviews', schema);

	return {

		createReviews: (params, callback) => {
			let review = new Model();
			Object.assign(review, params);
			review.save(callback);
		},
		
		findByExpertId: (params, callback) => {
			Model.find({expert: params.expert},callback);
		}


	}
}

module.exports = Model
