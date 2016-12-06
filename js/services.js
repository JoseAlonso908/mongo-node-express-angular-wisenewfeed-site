var __s = function ($http, $cookies, method, url, data) {
	method = method.toUpperCase()

	var query = {
		method: method,
		url: url,
		headers: {
			Authorization: 'Bearer ' + $cookies.get('token')
		},
	}

	if (['GET', 'DELETE'].indexOf(method) === -1) {
		query.data = data
	} else {
		query.params = data
	}

	// console.log(query)

	return $http(query).then(function (result) {
		return result.data
	})
}


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
.factory('fieldsListService', function ($http, $cookies) {
	return {
		get: function (country) {
			var params = {}
			if (country) {
				params.country = country
			}

			return __s($http, $cookies, 'get', '/static/categories', params)
		},
		getForUser: function (country) {
			var params = {}
			if (country) {
				params.country = country
			}

			return __s($http, $cookies, 'get', '/user/categories', params)
		},
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
.factory('identityService', function ($http, $timeout, $cookies, $auth, $q, $rootScope) {
	var _user = undefined
	// console.log('Remembered user')
	// console.log(_user)

	return {
		otherCache: {

		},
		getOther: function (id) {
			var self = this

			// if (self.otherCache[id]) {
			// 	var d = $q.defer()

			// 	d.resolve(self.otherCache[id])
				
			// 	return d.promise
			// }

			return __s($http, $cookies, 'get', '/user', {id: id})
			.then(function (result) {
				var user = result

				user.rating = user.rating || 1
				user.color = user.color || 'bronze'
				user.likes = user.likes || 0
				user.xp = user.xp || 0
				user.dislikes = user.dislikes || 0
				user.reactions = user.reactions || 0
				user.followers = user.followers || 0
				user.following = user.following || 0
				user.avatar = user.avatar || '/assets/images/avatar_placeholder.png'

				if (user.role) {
					user.role = user.role.charAt(0).toUpperCase() + user.role.slice(1)
				}

				user.contact = user.contact || {email: '', phone: '', skype: '', linkedin: '', fb: ''}

				// self.otherCache[id] = user

				return user
			}, function (data, status) {
				return data
			})
		},
		_user: {},
		get: function (clean) {
			var d = $q.defer(),
				self = this

			// var user = $cookies.getObject('user')
			if (_user && (clean === undefined || clean === false)) {
				// console.log('Returning remembered')
				// console.log(_user)
				d.resolve(_user)
			} else {
				return __s($http, $cookies, 'get', '/me' + ((clean) ? ('?x=' + Math.random()) : ''))
				.then(function (response) {
					var user = response

					user.rating = user.rating || 1
					user.color = user.color || 'bronze'
					user.xp = user.xp || 0
					user.followers = user.followers || 0
					user.following = user.following || 0
					user.avatar = user.avatar || '/assets/images/avatar_placeholder.png'

					if (user.role) {
						user.role = user.role.charAt(0).toUpperCase() + user.role.slice(1)
					}

					user.contact = user.contact || {email: '', phone: '', skype: '', linkedin: '', fb: ''}

					_user = user

					// if (localStorage.rememberLogin && localStorage.rememberLogin != 'false') {
					// 	// $cookies.putObject('user', user, {expires: new Date(Date.now() + (168 * 3600 * 1000))})
					// } else {
					// 	// $cookies.putObject('user', user)
					// }

					$cookies.put('token', $auth.getToken())

					d.resolve(user)
					return user
				})
			}

			return d.promise
		},
		clean: function () {
			_user = undefined
			this.otherCache = {}
		},
		updateSettings: function (data) {
			return __s($http, $cookies, 'post', '/profile/edit/settings', data)
		},
		isPasswordValid: function (password) {
			return __s($http, $cookies, 'post', '/profile/settings/isPasswordValid', {password: password}).then(function (response) {
				return response.valid
			}, function (error) {
				return error
			})
		},
		updatePassword: function (oldPassword, newPassword) {
			return __s($http, $cookies, 'post', '/profile/settings/setPassword', {oldPassword: oldPassword, newPassword: newPassword})
		},
		disconnectSocial: function (provider) {
			return __s($http, $cookies, 'post', '/profile/settings/disconnectsocial', {provider: provider})
		},
		updateNotifications: function (data) {
			return __s($http, $cookies, 'post', '/profile/settings/notifications', data)
		},
		mutedAuthors: function () {
			return __s($http, $cookies, 'get', '/user/mutedauthors')
		},
		block: function (user) {
			return __s($http, $cookies, 'post', '/user/block', {user: user})
		},
		unblock: function (user) {
			return __s($http, $cookies, 'post', '/user/unblock', {user: user})
		},
		report: function (article) {
			return __s($http, $cookies, 'post', '/user/report', {article: article})
		},
	}
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
		all: function (category, country) {
			var params = {}
			if (category != undefined) {
				params['category'] = category
			}

			if (country != undefined) {
				params['country'] = country
			}

			return __s($http, $cookies, 'get', '/article/all', params)
		},
		byUser: function (user) {
			return __s($http, $cookies, 'get', '/article/byuser', {user: user})
		},
		my: function () {
			return __s($http, $cookies, 'get', '/article/my')
		},
		feed: function (category, country, userId) {
			var params = {}
			if (userId) {
				params.userId = userId
			}

			if (category) {
				params.category = category
			}

			if (country) {
				params.country = country
			}

			return __s($http, $cookies, 'get', '/article/feed?r=' + Math.random(), params)
		},
		reacted: function (user, type) {
			return __s($http, $cookies, 'get', '/article/feed/' + type, {user: user})
		},
	}
})
.factory('postService', function ($http, $cookies, $timeout) {
	return {
		get: function (id) {
			return __s($http, $cookies, 'get', '/article/one', {id: id})
		},
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
							// console.log(e.loaded, e.total)
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
		remove: function (postId) {
			return __s($http, $cookies, 'post', '/article/remove', {article: postId})
		},
		queue: [],
		delay: 1000,
		timer: undefined,
		getComments: function (postId) {
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

				return __s($http, $cookies, 'get', '/article/comment/get/few', {postIds: postIds.join(',')})
				.then(function (result) {
					var reactions = result

					for (var postId in reactions) {
						var rs = reactions[postId]

						for (var j in service.queue) {
							if (service.queue[j].postId == postId) {
								service.queue[j].resolve(rs)
							}
						}
					}
				}, function (data, status) {
					return data
				})

				$timeout.cancel(service.timer)
			}, this.delay, false, this)

			return promise
		},
		getCommentsImmediate: function (postId) {
			return __s($http, $cookies, 'get', '/article/comment/get', {postId: postId})
		},
		hide: function (article) {
			return __s($http, $cookies, 'post', '/article/hide', {article: article})
		},
		unhide: function (article) {
			return __s($http, $cookies, 'post', '/article/unhide', {article: article})
		},
		mute: function (author) {
			return __s($http, $cookies, 'post', '/article/mute', {author: author})
		},
		unmute: function (author) {
			return __s($http, $cookies, 'post', '/article/unmute', {author: author})
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

				return __s($http, $cookies, 'get', '/article/reactions/few', {postIds: postIds.join(',')})
				.then(function (reactions) {
					for (var postId in reactions) {
						var rs = reactions[postId]

						for (var j in service.queue) {
							if (service.queue[j].postId == postId) {
								service.queue[j].resolve(rs)
							}
						}
					}
				}, function (data, status) {
					return data
				})

				$timeout.cancel(service.timer)
			}, this.delay, false, this)

			return promise
		},
		getImmediate: function (postId) {
			return __s($http, $cookies, 'get', '/article/reactions', {post: postId})
		},
		react: function (postId, type) {
			return __s($http, $cookies, 'post', '/article/react', {post: postId, type: type})
		},
		unreact: function (postId, type) {
			return __s($http, $cookies, 'delete', '/article/react', {post: postId, type: type})
		},
	}
})
.factory('followService', function ($http, $cookies, identityService) {
	return {
		isFollowing: function (following) {
			return __s($http, $cookies, 'get', '/follow/isFollowing', {following: following})
			.then(function (result) {
				return result.isFollowing
			}, function (data, status) {
				return data
			})
		},
		follow: function (following) {
			return __s($http, $cookies, 'post', '/follow/follow', {following: following})
			.then(function (result) {
				// identityService._user.reactions.following++
				// if (identityService.otherCache[following]) identityService.otherCache[following].reactions.followers++

				return result.isFollowing
			}, function (data, status) {
				return data
			})
		},
		unfollow: function (following) {
			return __s($http, $cookies, 'post', '/follow/unfollow', {following: following})
			.then(function (result) {
				// identityService._user.reactions.following--
				// if (identityService.otherCache[following]) identityService.otherCache[following].reactions.followers++

				return result.isFollowing
			}, function (data, status) {
				return data
			})
		},
		following: function (follower, skip, limit, sort) {
			if (sort) {
				sort = sort.join('|')
			}

			return __s($http, $cookies, 'get', '/follow/following', {follower: follower, skip: skip, limit: limit, sort: sort})
			.then(function (result) {
				return result.map(function (person) {
					return person.following
				})
			}, function (data, status) {
				return data
			})
		},
		followers: function (following, skip, limit, sort) {
			if (sort) {
				sort = sort.join('|')
			}

			return __s($http, $cookies, 'get', '/follow/followers', {following: following, skip: skip, limit: limit, sort: sort})
			.then(function (result) {
				return result.map(function (person) {
					var follower = person.follower
					Object.assign(follower, {isFollowing: person.isFollowing})

					return follower
				})
			}, function (data, status) {
				return data
			})
		},
		unread: function () {
			return __s($http, $cookies, 'get', '/follow/unread')
			.then(function (result) {
				return result.count
			}, function (data, status) {
				return data
			})
		},
		setReadForUser: function () {
			return __s($http, $cookies, 'post', '/follow/setreadall')
		},
	}
})
.factory('piecesService', function ($http, $cookies) {
	return {
		get: function () {
			return __s($http, $cookies, 'get', '/article/pieces')
		},
	}
})
.factory('commentReactionsService', function ($http, $cookies, $timeout) {
	return {
		queue: [],
		delay: 500,
		timer: undefined,
		get: function (commentId) {
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
				commentId: commentId,
				promise: promise,
				resolve: externalResolve,
				reject: externalReject,
			})

			$timeout.cancel(this.timer)

			this.timer = $timeout(function (service) {
				var commentIds = []

				for (var i in service.queue) {
					var item = service.queue[i]
					commentIds.push(item.commentId)
				}

				return __s($http, $cookies, 'get', '/article/comment/reactions/few', {commentIds: commentIds.join(',')})
				.then(function (reactions) {
					for (var commentId in reactions) {
						var rs = reactions[commentId]

						for (var j in service.queue) {
							if (service.queue[j].commentId == commentId) {
								service.queue[j].resolve(rs)
							}
						}
					}
				}, function (data, status) {
					return data
				})

				$timeout.cancel(service.timer)
			}, this.delay, false, this)

			return promise
		},
		getImmediate: function (postId) {
			return __s($http, $cookies, 'get', '/article/comment/reactions', {comment: commentId})
		},
		react: function (commentId, type) {
			return __s($http, $cookies, 'post', '/article/comment/react', {comment: commentId, type: type})
		},
		unreact: function (commentId, type) {
			return __s($http, $cookies, 'delete', '/article/comment/react', {comment: commentId, type: type})
		},
	}
})
.factory('familiarExpertsService', function () {
	return {
		get: function () {
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
		}
	}
})
.factory('categoriesService', function ($http, $q) {
	return function (code) {
		var d = $q.defer()

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
.factory('groupedCountriesService', function ($http, $cookies, $q) {
	return {
		get: function () {
			return __s($http, $cookies, 'get', '/static/countries/grouped')
		}
	}
})
.factory('notificationService', function ($http, $cookies) {
	return {
		list: [],
		get: function () {
			var self = this

			return __s($http, $cookies, 'get', '/n/get?r=' + Math.random())
			.then(function (result) {
				self.list = result
				return result
			}, function (data, status) {
				return data
			})
		},
		setReadForUser: function () {
			return __s($http, $cookies, 'post', '/n/setreadall')
		},
	}
})
.factory('questionsService', function ($http, $cookies) {
	return {
		add: function (recipient, text) {
			return __s($http, $cookies, 'post', '/questions/create', {recipient: recipient, text: text})
		},
		cancel: function (id) {
			return __s($http, $cookies, 'post', '/questions/settype', {question: id, type: 'cancelled'})
		},
		list: [],
		get: function (user, skip, limit) {
			var self = this

			var params = {}
			if (user) params.user = user
			if (skip) params.skip = skip
			if (limit) params.limit = limit

			return __s($http, $cookies, 'get', '/questions/all', params)
			.then(function (result) {
				self.list = result
				return result
			})
		}
	}
})