const config = require('./../config')
const env = 'development'

const path = require('path')

global.__root = path.join(__dirname, '..')

var mongoose = require('mongoose')
mongoose.Promise = Promise
let connection = mongoose.connect(config.MONGO[env].DSN)

global.models = {
	User: require('./../models/user')(connection),
	Article: require('./../models/article')(connection),
	Comment: require('./../models/comment')(connection),
}

let pieces = {
	'#': {
		type: 'tags',
		list: {}
	},
	'@': {
		type: 'people',
		list: {}
	},

	'$': {
		type: 'categories',
		list: {}
	},
}

models.Article.getAll((err, articles) => {
	for (let article of articles) {
		let aPieces = article.text.match(/(\#[a-z0-9]+|\@[a-z0-9]+|\$[a-z0-9]+)/gi)

		if (!aPieces) continue

		for (let aPiece of aPieces) {
			let typeChar = aPiece[0]

			if (typeof pieces[typeChar].list[aPiece] === undefined) {
				pieces[typeChar].list[aPiece] = 1
			} else {
				pieces[typeChar].list[aPiece]++
			}
		}
	}

	console.log(pieces)

	mongoose.connection.close()
})