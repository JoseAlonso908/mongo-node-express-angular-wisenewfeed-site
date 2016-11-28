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
		createdAt	: {type: Date, default: Date.now},
	})

	var Model = mongoose.model('question', schema);

	return {
		create: (author, recipient, text, callback) => {
			author = MOI(author)
			recipient = MOI(recipient)

			let question = new Model()
			Object.assign(question, {
				author, recipient, text
			})
			question.save(callback)
		},

		getByRecipient: (recipient, skip = 0, limit = 100, callback) => {
			recipient = MOI(recipient)
			Model.find({recipient}).populate('author').skip(Number(skip)).limit(Number(limit)).sort({createdAt: 'asc'}).lean().exec(callback)
		},

		getByRecipientOfType: (recipient, type, skip = 0, limit = 100, callback) => {
			recipient = MOI(recipient)
			let query = Model.find({recipient, type}).populate('author').lean().sort({createdAt: 'asc'})
			if (skip) query.skip(Number(skip))
			if (limit) query.skip(Number(limit))
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
	}
}

module.exports = Model