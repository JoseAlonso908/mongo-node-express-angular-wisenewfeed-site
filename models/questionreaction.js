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
        type		: {
            type: String,
            enum: ['like', 'dislike'],
        },
		createdAt	: {type: Date, default: Date.now},
	})

	var Model = mongoose.model('questionreaction', schema);

	return {
		react: function (question, type, author, callback) {
			question = MOI(question)
			author = MOI(author)

			async.series({
                opposite: (next) => {
					Model.find({question, author}).exec((err, reactions) => {
						let existing

						for (let r of reactions) {
							if ((type == 'like' && r.type == 'dislike') || (type == 'dislike' && r.type == 'like')) {
								return Model.remove({_id: r.id}, (err) => {
									next(err, null)
								})
							} else {
                                return next({message: 'Like already exist'})
							}
						}

						next(null)
					})
				},
				create: (next) => {
					let reaction = new Model()
					Object.assign(reaction, {question, type, author})
					reaction.save((err, result) => {
						next()
					})
				},
				counts: (next) => {
					this.getReactionsCountForQuestion(question, next)
				},
                youdid: (next) => {
                    this.reactionsByViewer(author, question, next)
                },
			}, (err, results) => {
                callback(err, {counts: results.counts, youdid: results.youdid})
			})
		},

        unreact: function (question, type, author, callback) {
            question = MOI(question)
            author = MOI(author)

            async.series({
            	remove: (next) => {
                    Model.remove({question, type, author}, next)
                },
                counts: (next) => {
            	    this.getReactionsCountForQuestion(question, next)
                },
				youdid: (next) => {
            		this.reactionsByViewer(author, question, next)
				},
			}, (err, results) => {
            	callback(err, {counts: results.counts, youdid: results.youdid})
			})
        },

        getReactionsCountForQuestion: (question, callback) => {
			question = MOI(question)

			let counts = {
				likes: 0,
				dislikes: 0,
			}

			Model.find({question}, (err, reactions) => {
				for (let r of reactions) {
					counts[r.type + 's']++
				}

                callback(err, counts)
			})
		},

        getReactionsForQuestion: (question, callback) => {
			question = MOI(question)
			Model.find({question}).lean().exec(callback)
		},

		reactionsByViewer: (viewer, question, callback) => {
			question = MOI(question)
			viewer = MOI(viewer)

			Model.find({author: viewer, question}).lean().exec((err, reactions) => {
				let viewerReactions = {
					like: false,
					dislike: false,
				}

                for (let r of reactions) {
					if (r.type == 'like') viewerReactions.like = true
                    else if (r.type == 'dislike') viewerReactions.dislike = true
				}

				callback(err, viewerReactions)
			})
		}
	}
}

module.exports = Model