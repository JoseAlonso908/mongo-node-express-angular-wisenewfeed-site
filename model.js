const path = require('path')

module.exports = (dsn, __root) => {
	let mongoose = require('mongoose')

	// Mongoose's own promise is deprecated
	mongoose.Promise = Promise
	let connection = mongoose.connect(dsn)
    // mongoose.set('debug', true);

	let modelsNames =
		['User', 'Token', 'Article', 'Comment', 'PostReaction',
		'CommentReaction', 'PhoneVerification', 'ResetPassword',
		'FindAccount', 'Piece', 'Follow', 'Notification', 'Question',
		'QuestionReaction', 'HiddenArticle', 'MutedAuthor', 'BlockedUser',
		'Report', 'ExperienceLog', 'Message', 'Friendship', 'Image',
		'ImageReaction'],

		models = {}

	for (let model of modelsNames) {
		models[model] = require(path.join(__root, 'models', model.toLowerCase()))(connection)
	}

	// Turn ID string to mongoose object
	global.MOI = (id) => {
		if (typeof id !== 'object') id = mongoose.Types.ObjectId(id)
		return id
	}

	return {
		models: () => {
			return models
		},
		closeConnection: () => {
			mongoose.connection.close()
		},
	}
}
