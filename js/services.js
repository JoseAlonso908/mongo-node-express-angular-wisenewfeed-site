angular.module('er.services', [])
.factory('findAccountRequestService', function ($http, $q) {
	return function (value) {
		var d = $q.defer()

		$http.post('/auth/findaccount/request', {value: value}).then(function (response) {
			d.resolve(response.data)
		}, function (error) {
			d.reject(error.data.message)
		})

		return d.promise
	}
})
.factory('findAccountSigninService', function ($http, $q) {
	return function (code) {
		var d = $q.defer()

		$http.post('/auth/findaccount/signin', {code: code}).then(function (response) {
			d.resolve(response.data)
		}, function (error) {
			d.reject(error.data.message)
		})

		return d.promise
	}
})
.factory('forgotPasswordService', function ($http, $q) {
	return function (email) {
		var d = $q.defer()

		$http.post('/auth/forgotpassword', {email: email}).then(function (response) {
			d.resolve(response.data)
		}, function (error) {
			d.reject(error.data.message)
		})

		return d.promise
	}
})
.factory('checkPasswordTokenService', function ($http, $q) {
	return function (token) {
		var d = $q.defer()

		$http.post('/auth/forgotpassword/validate', {token: token}).then(function (response) {
			d.resolve(response.data)
		}, function (error) {
			d.reject(error.data.message)
		})

		return d.promise
	}
})
.factory('resetPasswordService', function ($http, $q) {
	return function (token, newpassword) {
		var d = $q.defer()

		$http.post('/auth/resetpassword', {token: token, newpassword: newpassword}).then(function (response) {
			d.resolve(response.data)
		}, function (error) {
			d.reject(error.data.message)
		})

		return d.promise
	}
})
.factory('validateEmailService', function ($http, $q) {
	return function (email) {
		var d = $q.defer()

		$http.post('/auth/signup/validate/email', {email: email}).then(function (response) {
			d.resolve(response.data)
		}, function (error) {
			d.reject(error.data.message)
		})

		return d.promise
	}
})
.factory('validatePhoneService', function ($http, $q) {
	return function (phone) {
		var d = $q.defer()

		$http.post('/auth/signup/validate/phone', {phone: phone}).then(function (response) {
			d.resolve(response.data)
		}, function (error) {
			d.reject(error.data.message)
		})

		return d.promise
	}
})
.factory('verifyPhoneService', function ($http, $q) {
	return function (phone) {
		var d = $q.defer()

		$http.post('/auth/signup/verify/phone', {phone: phone}).then(function (response) {
			d.resolve(response.data)
		}, function (error) {
			d.reject(error.data.message)
		})

		return d.promise
	}
})
.factory('verifyPhoneCodeService', function ($http, $q) {
	return function (phone, code) {
		var d = $q.defer()

		$http.post('/auth/signup/verifycode/phone', {phone: phone, code: code}).then(function (response) {
			d.resolve(response.data)
		}, function (error) {
			d.reject(error.data.message)
		})

		return d.promise
	}
})
.factory('countriesListService', function ($http, $q) {
	return function () {
		var d = $q.defer()

		$http.get('/static/countries').then(function (response) {
			d.resolve(response.data)
		})

		return d.promise
	}
})
.factory('identityService', function ($timeout, $http, $cookies, $auth, $q) {
	return function () {
		var d = $q.defer()

		var user = $cookies.getObject('user')
		if (user) d.resolve(user)
		else {
			$http.get('/me', {
				header: {
					authorization: $auth.getToken()
				}
			}).then(function (response) {
				var user = response.data

				user.rating = user.rating || 1
				user.color = user.color || 'bronze'
				user.likes = user.likes || 0
				user.xp = user.xp || 0
				user.dislikes = user.dislikes || 0
				user.reactions = user.reactions || 0
				user.followers = user.followers || 0
				user.following = user.following || 0
				user.avatar = user.avatar || '/assets/images/avatar_placeholder.png'
				user.role = user.role.charAt(0).toUpperCase() + user.role.slice(1)

				user.experience = user.experience || [
					{
						time: 'Aug \'13 - Jun \'15',
						place: 'Co & Co',
						description: 'Did nothing here',
					},

					{
						time: 'Jun \'15 - Today',
						place: 'Co & Co - 2',
						description: 'Did a lot of things here',
					},
				]

				console.log(localStorage.rememberLogin)
				if (localStorage.rememberLogin && localStorage.rememberLogin != 'false') {
					$cookies.putObject('user', user, {expires: new Date(Date.now() + (168 * 3600 * 1000))})
				} else {
					$cookies.putObject('user', user)
				}

				$cookies.put('token', $auth.getToken())

				localStorage.removeItem('satellizer_token')

				d.resolve(user)
			}, function (error) {
				d.reject(error.message)
			})
		}

		return d.promise
	}

	// return new Promise(function (resolve, reject) {
	// 	$timeout(function () {
	// 		var user = {
	// 			name: 'Jack Daniels',
	// 			position: 'Director',
	// 			avatar: 'http://i.imgur.com/wq43v5T.jpg',
	// 			rating: 1,
	// 			color: 'bronze',
	// 			wallpaper: 'https://metrouk2.files.wordpress.com/2015/04/mm1-e1429271504595.png',
	// 			xp: 72,
	// 			likes: 4223,
	// 			dislikes: 23,
	// 			reactions: 1200,
	// 			following: 23200,
	// 			followers: 43002,
	// 			likes_percentage: 45,
	// 			intro: 'Lorem ipsum dolor sit amet, neglegentur vituperatoribus cum ei. Facete dolorum aliquando duo ne, pro an delenit praesentea perpetua adipiscing eos, civibus.',
	// 			experience: 'Lorem ipsum dolor sit amet, neglegentur vituperatoribus cum ei.',
	// 			certificates: [
	// 				{title: 'Lorem Ipsum certificate'},
	// 				{title: 'Dolor certificate'}
	// 			],
	// 			downloads: [
	// 				{title: 'DESIGN.PSD'},
	// 				{title: 'PROTOTYPE.PDF'},
	// 			],
	// 			address: {
	// 				email: 'test@example.com',
	// 				phone: '+1 234 567 89 00',
	// 				skype: 'test.example',
	// 				linkedin: 'linked.in',
	// 				fb: 'fb.name',
	// 			},
	// 			photos: [
	// 				{url: 'http://statici.behindthevoiceactors.com/behindthevoiceactors/_img/actors/danny-devito-19.9.jpg'},
	// 				{url: 'https://www.picsofcelebrities.com/celebrity/danny-devito/pictures/large/danny-devito-family.jpg'},
	// 				{url: 'http://vignette2.wikia.nocookie.net/godfather-fanon/images/a/aa/Tommy_DeVito.jpg/revision/latest?cb=20121121213421'},
	// 				{url: 'http://img2.rnkr-static.com/list_img_v2/2752/102752/870/danny-devito-movies-and-films-and-filmography-u2.jpg'},
	// 				{url: 'https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcTkkc5M14e2-ePKz8nRrlUEAm64QmscRx2MneSFew1M2uL45CpW'},
	// 				{url: 'https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcSE78J23sFfj0hRZcFc_iZ8wgXKbSNoazvfLSydHE-FP7dVunyo'},
	// 				{url: 'https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcQRyoFyo7FBvCUFlEY8lIRRHREIBmXmXGxNt7-lEbRAQX7s27qAPw'},
	// 				{url: 'http://www.mcmbuzz.com/wp-content/uploads/2012/07/Danny-DeVito-at-the-London-MCM-Expo-3.jpg'},
	// 				{url: 'http://img.mypopulars.com/images/danny-devito/danny-devito_18.jpg'},
	// 				{url: 'http://www.filmreference.com/images/sjff_03_img1053.jpg'},
	// 				{url: 'http://i.dailymail.co.uk/i/pix/2015/01/19/24D7DB8200000578-0-image-a-1_1421687572450.jpg'},
	// 				{url: 'http://images.onionstatic.com/starwipe/6670/original/780.jpg'},
	// 				{url: 'https://s-media-cache-ak0.pinimg.com/236x/38/13/88/381388169d3c32162073fa96876d07e4.jpg'},
	// 			],
	// 			questions: [
	// 				{
	// 					author: {
	// 						name: 'Alla Pugacheva',
	// 						avatar: 'http://ua-reporter.com/sites/default/files/pug_zzz.jpg',
	// 						rating: 1,
	// 						color: 'bronze',
	// 						role: 'Visitor',
	// 						country: 'Russia',
	// 					},
	// 					text: 'Lorem ipsum dolor sit amet?',
	// 					likes: '3'
	// 				},
	// 			]
	// 		}

	// 		var chosenPhotos = []
	// 		user.randomPhotos = []

	// 		if (user.photos.length <= 8) {
	// 			user.randomPhotos = user.photos

	// 			for (var i = user.randomPhotos.length; i < 9; i++) {
	// 				user.randomPhotos.push({url: ''})
	// 			}
	// 		} else {
	// 			for (var i = 0; i < 8;) {
	// 				var randomPhotoKey = Math.floor(Math.random() * user.photos.length)
	// 				if (chosenPhotos.indexOf(randomPhotoKey) === -1) {
	// 					user.randomPhotos.push(user.photos[randomPhotoKey])
	// 					chosenPhotos.push(randomPhotoKey)
	// 					i++
	// 				}
	// 			}
	// 		}

	// 		user.likes = numeral(user.likes).format('0a').toUpperCase()
	// 		user.dislikes = numeral(user.dislikes).format('0a').toUpperCase()
	// 		user.reactions = numeral(user.reactions).format('0a').toUpperCase()
	// 		user.following= numeral(user.following).format('0a').toUpperCase()
	// 		user.followers = numeral(user.followers).format('0a').toUpperCase()

	// 		resolve(user)
	// 	}, 300)
	// })
})
.factory('uploadAvatarService', function ($http, $cookies) {
	return function (file) {
		console.log(file.native)

		return new Promise(function (resolve, reject) {
			var fd = new FormData()
			fd.append('file', file)
			fd.token('token', $cookies.get('token'))

			$http({
				method: 'POST',
				url: '/profile/edit/avatar',
				headers: {
					'Content-Type': undefined
				},
				fd,
				// transformRequest: function (data, headersGetter) {
				// 	var formData = new FormData();
				// 	angular.forEach(data, function (value, key) {
				// 		formData.append(key, value);
				// 	});

				// 	var headers = headersGetter();
				// 	// delete headers['Content-Type'];

				// 	console.log(formData)

				// 	return formData;
				// }
			})
			.success(function (data) {
				console.log(data)
			})
			.error(function (data, status) {
				console.log(data)
				console.log(status)
			})
		})
	}
})
.factory('feedService', function ($timeout, $sce) {
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

			// post.text = $sce.trustAsHtml(parseTextService(post.text))

			if (post.comments) {
				for (var j in post.comments) {
					var comment = post.comments[j]
					// comment.text = $sce.trustAsHtml(parseTextService(comment.text))
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
		}, 400)
	})
})
.factory('categoriesService', function ($http, $q) {
	return function (code) {
		var d = $q.defer()

		// $http.post('/auth/findaccount/signin', {code: code}).then(function (response) {
		// 	d.resolve(response.data)
		// }, function (error) {
		// 	d.reject(error.data.message)
		// })

		var response = [
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

		d.resolve(response)

		return d.promise
	}
})
.factory('groupedCountriesService', function ($http, $q) {
	return function (code) {
		var d = $q.defer()

		// $http.post('/auth/findaccount/signin', {code: code}).then(function (response) {
		// 	d.resolve(response.data)
		// }, function (error) {
		// 	d.reject(error.data.message)
		// })

		var response = [
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

		d.resolve(response)

		return d.promise
	}
})