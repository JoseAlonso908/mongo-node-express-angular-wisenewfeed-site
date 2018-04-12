process.on('unhandledRejection', (reason, promise) => {
	console.log(reason)
	console.log(promise)
})

const config = require('./../config')
const env = 'development'

const path = require('path')

global.__root = path.join(__dirname, '..')
var modelWrapper = require('./../model')(config.MONGO[env].DSN, __root)
global.models = modelWrapper.models()

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

	'!': {
        type: 'countries',
        list: {},
    },
}

let Regexp = /(<br>|<q>|<\/q>|^|\s|&nbsp;)(#[a-z]+[a-z0-9]*|@[a-z]+[a-z0-9]*|\$[a-z]+[a-z0-9]*|![a-z]+[a-z0-9]*)/gmi

models.Article.getAllLean((err, articles) => {
	for (let article of articles) {
		if (!article.text) continue

		let aPieces = article.text.match(Regexp)
		if (!aPieces) continue

		for (let aPiece of aPieces) {
			aPiece = aPiece.replace(Regexp, '$2')

			aPiece = aPiece.trim()

			let typeChar = aPiece[0]

			if (pieces[typeChar].list[aPiece] === undefined) {
				pieces[typeChar].list[aPiece] = 1
			} else {
				pieces[typeChar].list[aPiece]++
			}
		}
	}

	let insertionItems = []

	for (let typeChar in pieces) {
		let group = pieces[typeChar]

		for (let piece in group.list) {
			insertionItems.push({
				title: piece,
				type: group.type,
				amount: group.list[piece]
			})
		}
	}

	models.Piece.clearAll(() => {
		models.Piece.addMulti(insertionItems)
		modelWrapper.closeConnection()
	})
})