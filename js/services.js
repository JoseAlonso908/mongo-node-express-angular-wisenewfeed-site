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
.factory('updateProfileService', function ($http, $cookies) {
	return function (contact, experience, intro, name, position) {
		return new Promise(function (resolve, reject) {
			$http({
				method: 'POST',
				url: '/profile/edit/profile',
				data: {
					token: $cookies.get('token'),
					contact: contact,
					experience: experience,
					intro: intro,
					name: name,
					position: position,
				},
			})
			.success(function (data) {
				resolve(data)
			})
			.error(function (data, status) {
				reject(data)
			})
		})
	}
})
.factory('identityService', function ($http, $cookies, $auth, $q) {
	var _user = undefined
	// console.log('Remembered user')
	// console.log(_user)

	return {
		get: function (clean) {
			var d = $q.defer()

			// var user = $cookies.getObject('user')
			if (_user && clean === undefined || clean === false) {
				// console.log('Returning remembered')
				// console.log(_user)
				d.resolve(_user)
			} else {
				$http.get('/me', {
					header: {
						authorization: ($auth.getToken() || $cookies.get('token'))
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

					user.contact = user.contact || {email: '', phone: '', skype: '', linkedin: '', fb: ''}

					user.experience = user.experience

					// if (user.experience.length == 0) {
					// 	user.experience = [
					// 		{
					// 			time: 'Aug \'13 - Jun \'15',
					// 			place: 'Co & Co',
					// 			description: 'Did nothing here',
					// 		},

					// 		{
					// 			time: 'Jun \'15 - Today',
					// 			place: 'Co & Co - 2',
					// 			description: 'Did a lot of things here',
					// 		},
					// 	]
					// }

					if (localStorage.rememberLogin && localStorage.rememberLogin != 'false') {
						// $cookies.putObject('user', user, {expires: new Date(Date.now() + (168 * 3600 * 1000))})
					} else {
						// $cookies.putObject('user', user)
					}

					_user = user

					$cookies.put('token', $auth.getToken())

					// localStorage.removeItem('satellizer_token')

					d.resolve(user)
				}, function (error) {
					d.reject(error.message)
				})
			}

			return d.promise
		},
		clean: function () {
			_user = undefined
		}
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
		return new Promise(function (resolve, reject) {
			var fd = new FormData()
			fd.append('file', file)
			fd.append('token', $cookies.get('token'))

			$http({
				method: 'POST',
				url: '/profile/edit/avatar',
				headers: {
					'Content-Type': undefined
				},
				data: fd,
			})
			.success(function (data) {
				resolve(data)
			})
			.error(function (data, status) {
				reject(data)
			})
		})
	}
})
.factory('uploadWallpaperService', function ($http, $cookies) {
	return function (file) {
		return new Promise(function (resolve, reject) {
			var fd = new FormData()
			fd.append('file', file)
			fd.append('token', $cookies.get('token'))

			$http({
				method: 'POST',
				url: '/profile/edit/wallpaper',
				headers: {
					'Content-Type': undefined
				},
				data: fd,
			})
			.success(function (data) {
				resolve(data)
			})
			.error(function (data, status) {
				reject(data)
			})
		})
	}
})
.factory('certificatesService', function ($http, $cookies) {
	return {
		add: function (file) {
			return new Promise(function (resolve, reject) {
				var fd = new FormData()
				fd.append('token', $cookies.get('token'))
				fd.append('file', file)

				$http({
					method: 'POST',
					url: '/profile/edit/addcertificate',
					headers: {
						'Content-Type': undefined
					},
					data: fd,
				})
				.success(function (data) {
					resolve(data)
				})
				.error(function (data, status) {
					reject(data)
				})
			})
		},
		remove: function (cert) {
			return new Promise(function (resolve, reject) {
				$http({
					method: 'POST',
					url: '/profile/edit/removecertificate',
					data: {
						filename: cert.filename,
						token: $cookies.get('token')
					},
				})
				.success(resolve)
				.error(function (data, status) {
					reject(data)
				})
			})
		}
	}
})
.factory('downloadsService', function ($http, $cookies) {
	return {
		add: function (file) {
			return new Promise(function (resolve, reject) {
				var fd = new FormData()
				fd.append('token', $cookies.get('token'))
				fd.append('file', file)

				$http({
					method: 'POST',
					url: '/profile/edit/adddownload',
					headers: {
						'Content-Type': undefined
					},
					data: fd,
				})
				.success(function (data) {
					resolve(data)
				})
				.error(function (data, status) {
					reject(data)
				})
			})
		},
		remove: function (file) {
			return new Promise(function (resolve, reject) {
				$http({
					method: 'POST',
					url: '/profile/edit/removedownload',
					data: {
						filename: file.filename,
						token: $cookies.get('token')
					},
				})
				.success(resolve)
				.error(function (data, status) {
					reject(data)
				})
			})
		},
	}
})
.factory('feedService', function ($sce, $http, $cookies) {
	return {
		all: function () {
			return $http({
				method: 'GET',
				url: '/article/all',
				cache: false,
				headers: {
					'Authorization': $cookies.get('token') || 'guest',
				},
			})
			.then(function (result) {
				return result.data
			}, function (data, status) {
				return data
			})
		},
		my: function () {
			return $http({
				method: 'GET',
				url: '/article/my',
				cache: false,
				headers: {
					'Authorization': $cookies.get('token'),
				},
			})
			.then(function (result) {
				return result.data
			}, function (data, status) {
				return data
			})
		}
	}
})
.factory('postService', function ($http, $cookies) {
	return {
		create: function (text, files) {
			return new Promise(function (resolve, reject) {
				var headers = {
					'Authorization': $cookies.get('token'),
				}

				if (files.length > 0) {
					var fd = new FormData()
					fd.append('text', text)

					for (var i in files) {
						fd.append('files', files[i])
					}

					headers['Content-Type'] = undefined
				} else {
					fd = {
						text: text
					}
				}

				$http({
					method: 'POST',
					url: '/article/create',
					headers: headers,
					uploadEventHandlers: {
						progress: function (e) {
							console.log(e.loaded, e.total)
						},
					},
					data: fd,
				})
				.success(function (data) {
					resolve(data)
				})
				.error(function (data, status) {
					reject(data)
				})
			})
		},
		getComments: function (postId) {
			return $http({
				method: 'GET',
				url: '/article/comment/get',
				cache: false,
				headers: {
					'Authorization': $cookies.get('token'),
				},
				params: {
					postId: postId
				}
			}).then(function (result) {
				return result.data
			}, function (data, status) {
				return data
			})
		},
	}
})
.factory('commentService', function ($http, $cookies) {
	return {
		add: function (postId, text, files) {
			var headers = {
				'Authorization': $cookies.get('token'),
			}

			if (files.length > 0) {
				var fd = new FormData()
				fd.append('postId', postId)
				fd.append('text', text)

				for (var i in files) {
					fd.append('files', files[i])
				}

				headers['Content-Type'] = undefined
			} else {
				var fd = {
					postId: postId,
					text: text
				}
			}

			return $http({
				method: 'POST',
				url: '/article/comment/add',
				headers: headers,
				data: fd,
			})
			.then(function (result) {
				return result
			}, function (data, status) {
				return data
			})
		}
	}
})
.factory('reactionsService', function ($http, $cookies, $timeout) {
	return {
		queue: [],
		delay: 500,
		timer: undefined,
		get: function (postId) {
			var externalResolve, externalReject
			var promise = new Promise(function (resolve, reject) {
				externalResolve = resolve
				externalReject = reject
			}).then(function (result) {
				return result
			}, function (data, status) {
				return data
			})

			this.queue.push({
				postId: postId,
				promise: promise,
				resolve: externalResolve,
				reject: externalReject,
			})

			$timeout.cancel(this.timer)

			this.timer = $timeout(function (service) {
				var postIds = []

				for (var i in service.queue) {
					var item = service.queue[i]
					postIds.push(item.postId)
				}

				return $http({
					method: 'GET',
					url: '/article/reactions/few',
					headers: {
						'Authorization': $cookies.get('token'),
					},
					params: {
						postIds: postIds.join(',')
					}
				})
				.then(function (result) {
					var reactions = result.data

					for (var postId in reactions) {
						var rs = reactions[postId]

						for (var j in service.queue) {
							if (service.queue[j].postId == postId) {
								console.log('Resolve!')
								console.log(rs.reactions.journalist.likes)
								service.queue[j].resolve(rs)
							}
						}
					}
				}, function (data, status) {
					return data
				})

				console.log(service.queue.length)
				$timeout.cancel(service.timer)
			}, this.delay, false, this)

			return promise
		},
		getImmediate: function (postId) {
			return $http({
				method: 'GET',
				url: '/article/reactions',
				headers: {
					'Authorization': $cookies.get('token'),
				},
				params: {
					post: postId
				}
			})
			.then(function (result) {
				return result.data
			}, function (data, status) {
				return data
			})
		},
		react: function (postId, type) {
			return $http({
				method: 'POST',
				url: '/article/react',
				headers: {
					'Authorization': $cookies.get('token'),
				},
				data: {
					post: postId,
					type: type
				},
			})
			.then(function (result) {
				return result
			}, function (data, status) {
				return data
			})
		},
		unreact: function (postId, type) {
			return $http({
				method: 'DELETE',
				url: '/article/react',
				headers: {
					'Authorization': $cookies.get('token'),
				},
				params: {
					post: postId,
					type: type
				},
			})
			.then(function (result) {
				return result
			}, function (data, status) {
				return data
			})
		},
	}
})
.factory('familiarExpertsService', function () {
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

		resolve(familiarExperts)
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