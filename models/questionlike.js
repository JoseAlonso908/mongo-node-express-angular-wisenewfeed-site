const async = require('async')

var Model = function(mongoose) {
	var schema = new mongoose.Schema({
		ObjectId	: mongoose.Schema.ObjectId,
		question	: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'question',
		},
		author 		: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'user',
		},
		createdAt	: {type: Date, default: Date.now},
	})

	var Model = mongoose.model('questionlike', schema);

	return {
		like: function (question, author, callback) {
			question = MOI(question)
			author = MOI(author)

			async.waterfall([
				(next) => {
					Model.findOne({question, author}).lean().exec(next)
				},
				(q, next) => {
					if (q) next({message: 'Like already exist'})
					else {
						let like = new Model()
						Object.assign(like, {question, author})
						like.save(next)
					}
				},
				(like, next) => {
					this.getLikesCountForQuestion(question, next)
				},
			], (err, a) => {
				console.log(err)
				console.log(a)
			})
		},

		getLikesCountForQuestion: (question, callback) => {
			question = MOI(question)
			Model.count({question}, callback)
		},

		getLikesForQuestions: (question, callback) => {
			question = MOI(question)

			Model.find({question}).lean().exec(callback)
		},

		isLikedByViewer: (viewer, question, callback) => {
			question = MOI(question)
			viewer = MOI(viewer)

			Model.findOne({author: viewer, question}).lean().exec((err, like) => {
				callback(err, !!like)
			})
		}
	}
}

module.exports = Model