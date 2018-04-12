const async = require('async')

var model = function (mongoose) {
	var schema = new mongoose.Schema({
		ObjectId	: mongoose.Schema.ObjectId,
		author		: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'user',
		},
		filename	: String,
		privacy		: {type: String, default: 'Stranger'},
	})

	var Model = mongoose.model('image', schema)

	let retainImagesPrivacy = (images, author, viewer, callback) => {
		if (author._id) author = author._id

		async.filter(images, (i, next) => {
			let allow = next.bind(async, null, true),
				decline = next.bind(async, null, false)

			// User always have access to own photos
			if (viewer && author.toString() == viewer.toString()) return allow()

			if (viewer) {
				// Not anonymous user

				if (i.privacy == 'Stranger') allow()
				else {
					models.Friendship.isFriend(author, viewer, (err, result) => {
						if (!result.accepted) decline()
						else {
							if (result.type == 'Family') allow()
							else if (result.type == 'Close friend' && ['Family'].indexOf(i.privacy) == -1) allow()
							else if (result.type == 'Friend' && ['Family', 'Close friend'].indexOf(i.privacy) == -1) allow()
							else decline()
						}
					})
				}
			} else {
				// Anonymous user

				if (i.privacy == 'Stranger') allow()
				else decline()
			}
		}, callback)
	}

	return {
		Model,

		create: (author, filename, callback) => {
			author = MOI(author)

			let image = new Model()
			Object.assign(image, {author, filename})
			image.save(callback)
		},

		createBunch: (author, filenames, privacy, callback) => {
			if (typeof privacy == 'function') {
				callback = privacy
			}

			author = MOI(author)

			let ids = []

			async.eachSeries(filenames, (filename, next) => {
				let image = new Model()
				Object.assign(image, {author, filename})
				image.save((err, image) => {
					ids.push(image._id)
					next()
				})
			}, (err) => {
				callback(err, ids)
			})
		},

		retainImagesPrivacy,

		imagesOfUser: (author, viewer, callback) => {
			author = MOI(author)
			viewer = (viewer) ? MOI(viewer) : viewer

			Model.find({author}).populate('author').lean().exec((err, images) => {
				retainImagesPrivacy(images, author, viewer, callback)
			})
		},

		remove: (author, id, callback) => {
			author = MOI(author)
			let _id = MOI(id)

			Model.remove({_id, author}, callback)
		},

		removeBunch: (author, ids, callback) => {
			author = MOI(author)
			ids = ids.map(MOI)

			Model.remove({_id: {$in: ids}, author}, callback)
		},

		setPrivacy: (author, id, privacy, callback) => {
			author = MOI(author)
			let _id = MOI(id)

			Model.findOne({_id, author}).exec((err, image) => {
				if (!image) return callback({message: 'Image does not exist'})

				Object.assign(image, {privacy})

				image.save(callback)
			})
		},
	}
}

module.exports = model