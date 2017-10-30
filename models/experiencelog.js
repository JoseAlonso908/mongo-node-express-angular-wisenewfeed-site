var Model = function(mongoose) {
	var schema = new mongoose.Schema({
		ObjectId	: mongoose.Schema.ObjectId,
		user		: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'user',
		},
		reward		: Number,
		post		: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'article',
		},
		comment		: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'comment',
		},
		type		: {
			type: String,
			enum: [
				'create', 'like', 'dislike', 'smart', 'share', 'comment', 'follow', 'post', 'article'
			],
		},
		createdAt	: {type: Date, default: Date.now},
	})

	var Model = mongoose.model('experiencelog', schema);

	return {
		award: (user, reward, post, comment, type, callback) => {
			user = MOI(user)
			post = MOI(post)
			comment = MOI(comment)

			let log = new Model()
			Object.assign(log, {user, reward, post, comment, type})
			log.save((err, result) => {
				models.User.findById(user, (err, user) => {
					if (reward < 0) reward = (reward < -user.xp) ? -user.xp : reward;
					if (user.xp === reward && user.role === 'expert') user.role = 'user'; // Downgrade expert to user;
					user.xp += reward
					user.save(callback)
				})
			})
		},
		awardedToday: (user, type, callback) => {
			if (typeof user !== 'object') user = mongoose.Types.ObjectId(user);

			let now = new Date();
			var startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			let query = Model.find({ user: user, type: type, createdAt: { $gte: startOfToday } });
			query.exec((err, records) => {
				return callback(err, records);
			});
		},
	}
}

module.exports = Model
