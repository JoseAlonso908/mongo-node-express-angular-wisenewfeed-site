const async = require('async')

var Model = function(mongoose) {
	var schema = new mongoose.Schema({
		ObjectId	: mongoose.Schema.ObjectId,
		title		: String,
		type		: {
			type: String,
			enum: ['tags', 'people', 'categories', 'countries'],
		},
		amount		: Number,
		createdAt	: {type: Date, default: Date.now},
	})

	var Model = mongoose.model('piece', schema);

	return {
		addMulti: (pieces, callback) => {
			Model.collection.insert(pieces, callback)
		},

		clearAll: (callback) => {
			Model.remove({}, callback)
		},

		getTopGrouped: (callback) => {
			let result = {}

			async.each(['tags', 'people', 'categories', 'countries'], (type, next) => {
				Model.find({type}).sort({amount: 'desc'}).limit(10).exec((err, items) => {
					result[type] = items
					next()
				})
            }, (err) => {
				callback(err, result)
			})
		},

		search: (query, options, callback) => {
            const RESULTS_LIMIT = 5

			let countries = require('countries-list').countries
			let countriesTags = []

			for (let code in countries) {
				let country = countries[code]
				country = country.name.replace(/\s/g, '')
                countriesTags.push(`!${country.toLowerCase()}`)
			}

			let filteredCountriesTags = []

			let countryRegexp = (new RegExp(query, 'gi'))
			filteredCountriesTags = countriesTags.filter((country) => {
				return countryRegexp.test(country)
			})
			if (query[0] == '@') {
            	query = query.substring(1);
                models.User.searchFriendsAndFollowersNicknames(options.user, {query, limit: 5}, (err, results) => {
                    results = results.map((i) => {
                        return `@${i.nickname}`
                    }).concat(filteredCountriesTags).slice(0, RESULTS_LIMIT)
                    callback(null, results)

                })
            }  else {
                if (query[0] == '$') query = '\\' + query
                Model.find({title: new RegExp(query, 'gi')}).limit(RESULTS_LIMIT).exec((err, results) => {
                    if (err) callback(err)
                    else {
                        results = results.map((i) => {
                            return i.title
                        }).concat(filteredCountriesTags)

                        results = results.filter((item, key) => {
                            return results.indexOf(item) == key
                        }).slice(0, RESULTS_LIMIT)

                        callback(null, results)
                    }
                })
			}
		},
	}
}

module.exports = Model