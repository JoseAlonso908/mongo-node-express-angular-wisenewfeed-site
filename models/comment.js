var Model = function(mongoose) {
	var schema = new mongoose.Schema({
		ObjectId	: mongoose.Schema.ObjectId,
		author		: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'user',
		},
		post		: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'article',
		},
		images		: [String],
		text		: String,
		createdAt	: {type: Date, default: Date.now},
		likes		: {type: Number, default: 0},
		dislikes	: {type: Number, default: 0},
	})

	var Model = mongoose.model('comment', schema);

	return {
		Model,

		findOneById: (_id, callback) => {
			if (typeof _id !== 'object') _id = mongoose.Types.ObjectId(_id)
			Model.findOne({_id}).populate('author').lean().exec(callback)
		},

		addComment: (post, author, text, images, callback) => {
			post = MOI(post)
			author = MOI(author)

			let comment = new Model()
			Object.assign(comment, {
				author, post, text, images
			})

			comment.save(callback)
		},

		editComment: (_id, author, text, images, callback) => {
			_id = MOI(_id)
			author = MOI(author)

			Model.findOne({_id, author}).exec((err, comment) => {
				Object.assign(comment, {text})
				comment.save(callback)
			})
		},

		removeComment: (user, comment, callback) => {
			_id = MOI(comment)
			author = MOI(user)

			Model.remove({_id, author}, callback)
		},

		getPostsComments: (postIds, callback) => {
			let result = {}

			postIds = postIds.map((id) => {
				if (typeof id !== 'object') return mongoose.Types.ObjectId(id)
				else return id
			})

			Model.find({post: {$in: postIds}}).populate('author').exec((err, comments) => {
				for (let comment of comments) {
					let postId = comment.post

					if (result[postId] === undefined) {
						result[postId] = []
					}

					result[postId].push(comment)
				}

				callback(err, result)
			})
		},

		getPostComments: (post, callback) => {
			if (typeof post !== 'object') post = mongoose.Types.ObjectId(post)

			Model.find({post}).populate('author').exec((err, comments) => {
				callback(err, comments)
			})
		},

		getByUser: (author, callback) => {
			if (typeof author !== 'object') author = mongoose.Types.ObjectId(author)

			Model.find({author}).select('-__v').populate('author').sort({createdAt: 'desc'}).exec(callback)
		},

		getByArticles: (articlesIds, callback) => {
			Model.find({post: {$in: articlesIds}}).exec(callback)
		},

		getByArticlesLean: (articlesIds, callback) => {
			Model.find({post: {$in: articlesIds}}).exec(callback)
		},
	}
}

module.exports = Model
