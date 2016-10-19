angular.module('er.services', [])
.factory('identityService', function ($timeout) {
	return new Promise(function (resolve, reject) {
		$timeout(function () {
			var user = {
				name: 'Jack Daniels',
				position: 'Director',
				avatar: 'http://i.imgur.com/wq43v5T.jpg',
				rating: 1,
				color: 'bronze',
				wallpaper: 'https://metrouk2.files.wordpress.com/2015/04/mm1-e1429271504595.png',
				xp: 72,
				likes: 4223,
				dislikes: 23,
				reactions: 1200,
				following: 23200,
				followers: 43002,
				likes_percentage: 45,
				intro: 'Lorem ipsum dolor sit amet, neglegentur vituperatoribus cum ei. Facete dolorum aliquando duo ne, pro an delenit praesentea perpetua adipiscing eos, civibus.',
				experience: 'Lorem ipsum dolor sit amet, neglegentur vituperatoribus cum ei.',
				certificates: [
					{title: 'Lorem Ipsum certificate'},
					{title: 'Dolor certificate'}
				],
				downloads: [
					{title: 'DESIGN.PSD'},
					{title: 'PROTOTYPE.PDF'},
				],
				address: {
					email: 'test@example.com',
					phone: '+1 234 567 89 00',
					skype: 'test.example',
					linkedin: 'linked.in',
					fb: 'fb.name',
				},
				photos: [
					{url: 'http://statici.behindthevoiceactors.com/behindthevoiceactors/_img/actors/danny-devito-19.9.jpg'},
					{url: 'https://www.picsofcelebrities.com/celebrity/danny-devito/pictures/large/danny-devito-family.jpg'},
					{url: 'http://vignette2.wikia.nocookie.net/godfather-fanon/images/a/aa/Tommy_DeVito.jpg/revision/latest?cb=20121121213421'},
					{url: 'http://img2.rnkr-static.com/list_img_v2/2752/102752/870/danny-devito-movies-and-films-and-filmography-u2.jpg'},
					{url: 'https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcTkkc5M14e2-ePKz8nRrlUEAm64QmscRx2MneSFew1M2uL45CpW'},
					{url: 'https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcSE78J23sFfj0hRZcFc_iZ8wgXKbSNoazvfLSydHE-FP7dVunyo'},
					{url: 'https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcQRyoFyo7FBvCUFlEY8lIRRHREIBmXmXGxNt7-lEbRAQX7s27qAPw'},
					{url: 'http://www.mcmbuzz.com/wp-content/uploads/2012/07/Danny-DeVito-at-the-London-MCM-Expo-3.jpg'},
					{url: 'http://img.mypopulars.com/images/danny-devito/danny-devito_18.jpg'},
					{url: 'http://www.filmreference.com/images/sjff_03_img1053.jpg'},
					{url: 'http://i.dailymail.co.uk/i/pix/2015/01/19/24D7DB8200000578-0-image-a-1_1421687572450.jpg'},
					{url: 'http://images.onionstatic.com/starwipe/6670/original/780.jpg'},
					{url: 'https://s-media-cache-ak0.pinimg.com/236x/38/13/88/381388169d3c32162073fa96876d07e4.jpg'},
				],
				questions: [
					{
						author: {
							name: 'Alla Pugacheva',
							avatar: 'http://ua-reporter.com/sites/default/files/pug_zzz.jpg',
							rating: 1,
							color: 'bronze',
							role: 'Visitor',
							country: 'Russia',
						},
						text: 'Lorem ipsum dolor sit amet?',
						likes: '3'
					},
				]
			}

			var chosenPhotos = []
			user.randomPhotos = []

			if (user.photos.length <= 8) {
				user.randomPhotos = user.photos

				for (var i = user.randomPhotos.length; i < 9; i++) {
					user.randomPhotos.push({url: ''})
				}
			} else {
				for (var i = 0; i < 8;) {
					var randomPhotoKey = Math.floor(Math.random() * user.photos.length)
					if (chosenPhotos.indexOf(randomPhotoKey) === -1) {
						user.randomPhotos.push(user.photos[randomPhotoKey])
						chosenPhotos.push(randomPhotoKey)
						i++
					}
				}
			}

			user.likes = numeral(user.likes).format('0a').toUpperCase()
			user.dislikes = numeral(user.dislikes).format('0a').toUpperCase()
			user.reactions = numeral(user.reactions).format('0a').toUpperCase()
			user.following= numeral(user.following).format('0a').toUpperCase()
			user.followers = numeral(user.followers).format('0a').toUpperCase()

			resolve(user)
		}, 300)
	})
})
.factory('feedService', function ($timeout, $sce, parseTextService) {
	return new Promise(function (resolve, reject) {
		var feed = [
			{
				id: 1,
				author: {
					name: 'Nicholas Cage',
					avatar: 'https://s.aolcdn.com/hss/storage/midas/627f1d890718ff2c58318a280145a153/203216448/nicholas-cage-con-air.jpg',
					rating: 1,
					color: 'gold',
					position: 'Director',
					country: 'United States',
				},
				createdAt: new Date(Date.now() - (Math.round(Math.random() * 1000) * 1000)),
				text: '@SomeGuy Lorem ipsum dolor sit amet, neglegentur vituperatoribus cum ei. Facete dolorum aliquando duo ne, pro an delenit praesentea perpetua adipisc eos, civibus.',
				image: 'https://s.aolcdn.com/hss/storage/midas/627f1d890718ff2c58318a280145a153/203216448/nicholas-cage-con-air.jpg',
				ratings: {
					expert: {
						likes: 12432,
						dislikes: 4230,
						shares: 1320,
					},
					journalist: {
						likes: 12432,
						dislikes: 4230,
						shares: 1320,
					},
					visitor: {
						likes: 12432,
						dislikes: 4230,
						shares: 1320,
					},
				},
				comments: [
					{
						id: 2,
						author: {
							name: 'Nicholas Cage',
							avatar: 'https://s.aolcdn.com/hss/storage/midas/627f1d890718ff2c58318a280145a153/203216448/nicholas-cage-con-air.jpg',
							rating: 2,
							color: 'silver',
							position: 'Director',
							country: 'United States',
						},
						createdAt: new Date(Date.now() - (Math.round(Math.random() * 1000) * 1000)),
						text: 'Lorem ipsum dolor sit amet, neglegentur vituperatoribus cum ei. Facete dolorum aliquando! #DieHard',
						likes: 12,
						dislikes: 1
					}
				]
			},
			{
				id: 2,
				author: {
					name: 'Nicholas Cage',
					avatar: 'https://s.aolcdn.com/hss/storage/midas/627f1d890718ff2c58318a280145a153/203216448/nicholas-cage-con-air.jpg',
					rating: 1,
					color: 'gold',
					position: 'Director',
					country: 'United States',
				},
				createdAt: new Date(Date.now() - (Math.round(Math.random() * 1000) * 1000)),
				text: 'Lorem ipsum dolor sit amet, neglegentur vituperatoribus cum ei. Facete dolorum aliquando duo ne, pro an delenit praesentea perpetua adipisc eos, civibus.',
				image: 'https://s.aolcdn.com/hss/storage/midas/627f1d890718ff2c58318a280145a153/203216448/nicholas-cage-con-air.jpg',
				ratings: {
					expert: {
						likes: 12432,
						dislikes: 4230,
						shares: 1320,
					},
					journalist: {
						likes: 12432,
						dislikes: 4230,
						shares: 1320,
					},
					visitor: {
						likes: 12432,
						dislikes: 4230,
						shares: 1320,
					},
				},
			},
			{
				id: 3,
				author: {
					name: 'John Lennon',
					avatar: 'https://s.aolcdn.com/hss/storage/midas/627f1d890718ff2c58318a280145a153/203216448/nicholas-cage-con-air.jpg',
					rating: 1,
					color: 'silver',
					position: 'Singer',
					country: 'United Kingdom',
				},
				createdAt: new Date(Date.now() - (Math.round(Math.random() * 1000) * 1000)),
				text: 'Lorem ipsum dolor sit amet, neglegentur vituperatoribus cum ei. Facete dolorum aliquando duo ne, pro an delenit praesentea perpetua adipisc eos, civibus.',
				ratings: {
					expert: {
						likes: 12432,
						dislikes: 4230,
						shares: 1320,
					},
					journalist: {
						likes: 12432,
						dislikes: 4230,
						shares: 1320,
					},
					visitor: {
						likes: 12432,
						dislikes: 4230,
						shares: 1320,
					},
				},
			}
		]

		for (var i in feed) {
			var post = feed[i]

			post.ratings.expert.likes = numeral(post.ratings.expert.likes).format('0a').toUpperCase()
			post.ratings.expert.dislikes = numeral(post.ratings.expert.dislikes).format('0a').toUpperCase()
			post.ratings.expert.shares = numeral(post.ratings.expert.shares).format('0a').toUpperCase()
			post.ratings.journalist.likes = numeral(post.ratings.journalist.likes).format('0a').toUpperCase()
			post.ratings.journalist.dislikes = numeral(post.ratings.journalist.dislikes).format('0a').toUpperCase()
			post.ratings.journalist.shares = numeral(post.ratings.journalist.shares).format('0a').toUpperCase()
			post.ratings.visitor.likes = numeral(post.ratings.visitor.likes).format('0a').toUpperCase()
			post.ratings.visitor.dislikes = numeral(post.ratings.visitor.dislikes).format('0a').toUpperCase()
			post.ratings.visitor.shares = numeral(post.ratings.visitor.shares).format('0a').toUpperCase()

			post.text = $sce.trustAsHtml(parseTextService(post.text))

			if (post.comments) {
				for (var j in post.comments) {
					var comment = post.comments[j]
					comment.text = $sce.trustAsHtml(parseTextService(comment.text))
					post.comments[j] = comment
				}
			}
			
			feed[i] = post
		}

		$timeout(function () {
			resolve(feed)
		}, 500)
	})
})
.factory('familiarExpertsService', function ($timeout) {
	return new Promise(function (resolve, reject) {
		var familiarExperts = [
			{
				id: 1,
				name: 'Keanu Reeves',
				role: 'Expert',
				image: 'https://s.aolcdn.com/hss/storage/midas/627f1d890718ff2c58318a280145a153/203216448/nicholas-cage-con-air.jpg',
				color: 'bronze',
				rating: 2,
				likes_percentage: 70,
			},
			{
				id: 2,
				name: 'Keanu Reeves',
				role: 'Expert',
				image: 'https://s.aolcdn.com/hss/storage/midas/627f1d890718ff2c58318a280145a153/203216448/nicholas-cage-con-air.jpg',
				color: 'bronze',
				rating: 2,
				likes_percentage: 70,
			},
			{
				id: 3,
				name: 'Keanu Reeves',
				role: 'Expert',
				image: 'https://s.aolcdn.com/hss/storage/midas/627f1d890718ff2c58318a280145a153/203216448/nicholas-cage-con-air.jpg',
				color: 'bronze',
				rating: 2,
				likes_percentage: 70,
			},
		]

		$timeout(function () {
			resolve(familiarExperts)
		}, 2000)
	})
})
.factory('dropdowns', function () {
	return function () {
		var dropdownButtons = angular.element(document.querySelectorAll('.menu-buttons.dropdown')),
			dropdownLists = angular.element(document.querySelectorAll('.dropdown-list')),
			body = angular.element(document.body)

		body.on('click', function () {dropdownLists.removeClass('active')})

		dropdownButtons.on('click', function (e) {
			e.stopImmediatePropagation()

			var dropdownId = angular.element(this).attr('dropdown-id')
			angular.element(document.querySelector('.dropdown-list[dropdown-id="' + dropdownId + '"]')).toggleClass('active')
		})
	}
})
.factory('categoriesDropdown', function () {
	var dropdownButton = angular.element(document.querySelector('.menu-buttons.dropdown[dropdown-id=categories]')),
		dropdownList = angular.element(document.querySelector('.dropdown-list[dropdown-id=categories]'))

	dropdownList.on('click', function (e) {e.stopImmediatePropagation()})

	var result = {}

	result.categories = [
		{id: 1, title: 'World News', count: 353478392},
		{id: 2, title: 'Canada News', count: 12478392},
		{id: 3, title: 'Buzz News', count: 4478392},
		{id: 4, title: 'Science', count: 2478392},
		{id: 5, title: 'Business', count: 532952},
		{id: 6, title: 'Health', count: 422321},
		{id: 7, title: 'Technology', count: 352210},
		{id: 8, title: 'Sport', count: 24990},
		{id: 9, title: 'Entertainment', count: 1224},
	]

	result.chosenCategory = result.categories[1]

	result.activeCategoryClass = function (cat) {
		return {'active': (cat.id === result.chosenCategory.id)}
	}

	result.setActiveCategory = function (cat) {
		result.chosenCategory = cat
		dropdownList.removeClass('active')
	}

	for (var i in result.categories) {
		result.categories[i].countShort = numeral(result.categories[i].count).format('0a').toUpperCase()
	}

	return result
})
.factory('countriesDropdown', function () {
	var dropdownButton = angular.element(document.querySelector('.menu-buttons.dropdown[dropdown-id=countries]')),
		dropdownList = angular.element(document.querySelector('.dropdown-list[dropdown-id=countries]'))

	dropdownList.on('click', function (e) {e.stopImmediatePropagation()})

	var result = {}

	result.countries = [
		{id: 1, title: 'North America', sub: [
			{id: 2, title: 'United States'},
			{id: 3, title: 'Canada'},
			{id: 4, title: 'Mexico'},
		]},
		{id: 5, title: 'Central & South America', sub: [
			{id: 6, title: 'Brazil'},
			{id: 7, title: 'Chile'},
			{id: 8, title: 'Argentina'},
		]}
	]

	result.chosenCountry = result.countries[0].sub[0]

	result.activeRegionClass = function (region) {
		var active = false

		for (var i in region.sub) {
			if (region.sub[i].id === result.chosenCountry.id) active = true
		}

		return {active: active}
	}

	result.activeCountryClass = function (country) {
		return {
			active: result.chosenCountry.id === country.id
		}
	}

	result.setActiveCountry = function (country) {
		result.chosenCountry = country
		dropdownList.removeClass('active')
	}

	return result
})
.factory('parseTextService', function () {
	return function (text, additionClasses) {
		if (!additionClasses) additionClasses = {tags: [], people: [], cats: []}

		text = text.replace(/#([a-z0-9]+)/gi, '<a href="#!/tag/$1" class="' + additionClasses['tags'].join(' ') + '">#$1</a>')
		text = text.replace(/@([a-z0-9]+)/gi, '<a href="#!/people/$1" class="' + additionClasses['people'].join(' ') + '">@$1</a>')
		text = text.replace(/\$([a-z0-9]+)/gi, '<a href="#!/category/$1" class="' + additionClasses['cats'].join(' ') + '">$$1</a>')

		return text
	}
})