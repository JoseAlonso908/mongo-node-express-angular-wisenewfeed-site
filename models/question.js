const async = require('async')

var Model = function(mongoose) {
	var schema = new mongoose.Schema({
		ObjectId	: mongoose.Schema.ObjectId,
		author		: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'user',
		},
		recipient 	: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'user',
		},
		type		: {
			type: String,
			enum: ['active', 'cancelled', 'replied'],
			default: 'active',
		},
		text		: String,
		response	: String,
		createdAt	: {type: Date, default: Date.now},
	})

	var Model = mongoose.model('question', schema);

	return {
		getById: (_id, callback) => {
			_id = MOI(_id)
			Model.findOne({_id}).populate('author').exec(callback)
		},

		create: (author, recipient, text, callback) => {
			author = MOI(author)
			recipient = MOI(recipient)

			let question = new Model()
			Object.assign(question, {
				author, recipient, text
			})
			question.save(callback)
		},

		getByRecipient: (viewer, recipient, type, skip = 0, limit = 100, callback) => {
			recipient = MOI(recipient)

			let query = {recipient}
			if (type) Object.assign(query, {type})

			Model.find(query).populate('author').skip(Number(skip)).limit(Number(limit)).sort({createdAt: 'asc'}).lean().exec((err, questions) => {
				async.mapSeries(questions, (q, next) => {
					async.series({
						reactedByViewer: (done) => {
							models.QuestionReaction.reactionsByViewer(viewer, q._id, (err, flag) => {
								q.youdid = flag
								done()
							})
						},
						likesCount: (done) => {
							models.QuestionReaction.getReactionsCountForQuestion(q._id, (err, count) => {
								q.reactions = count
								done()
							})
						},
					}, (err) => {
						next(null, q)
					})
				}, callback)
			})
		},

		getByRecipientOfType: (recipient, type, skip = 0, limit = 100, callback) => {
			recipient = MOI(recipient)
			let query = Model.find({recipient, type}).populate('author').lean().sort({createdAt: 'asc'})
			if (skip) query.skip(Number(skip))
			if (limit) query.limit(Number(limit))
			query.exec(callback)
		},

		setQuestionType: (_id, recipient, type, callback) => {
			_id = MOI(_id)
			recipient = MOI(recipient)

			Model.findOne({_id, recipient}).exec((err, question) => {
				if (!question) {
					return callback({message: 'Question not found'})
				}

				Object.assign(question, {type})
				question.save(callback)
			})
		},

		reply: (_id, response, callback) => {
			_id = MOI(_id)
			Model.findOne({_id}, (err, q) => {
				Object.assign(q, {response, type: 'replied'})
				q.save(callback)
			})
		}
	}
}

module.exports = Model