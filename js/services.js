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
.factory('fieldsListService', function ($http, $auth, $cookies) {
	return {
		get: function () {
			return $http({
				method: 'GET',
				url: '/static/categories',
			}).then(function (result) {
				return result.data
			}, function (error) {
				return error
			})
		},
		getForUser: function (country) {
			var params = {}
			if (country) {
				params.country = country
			}

			return $http({
				method: 'GET',
				url: '/user/categories',
				headers: {
					Authorization: 'Bearer ' + ($auth.getToken() || $cookies.get('token'))
				},
				params: params
			}).then(function (result) {
				return result.data
			}, function (error) {
				return error
			})
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

			return $http({
				method: 'GET',
				url: '/user',
				headers: {
					Authorization: 'Bearer ' + ($auth.getToken() || $cookies.get('token'))
				},
				params: {
					id: id,
				}
			})
			.then(function (result) {
				var user = result.data

				user.rating = user.rating || 1
				user.color = user.color || 'bronze'
				user.likes = user.likes || 0
				user.xp = user.xp || 0
				user.dislikes = user.dislikes || 0
				user.reactions = user.reactions || 0
				user.followers = user.followers || 0
				user.following = user.following || 0
				// user.avatar = user.avatar || '/assets/images/avatar_placeholder.png'

				var avatarImg = new Image()
				avatarImg.onload = function () {
					angular.element(avatarImg).data('loaded', true)
				}
				avatarImg.src = user.avatar

				$timeout(function () {
					if (!angular.element(avatarImg).data('loaded')) {
						user.avatar = '/assets/images/avatar_placeholder.png'
					}
				}, 1000)

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
				$http({
					method: 'GET',
					url: '/me' + ((clean) ? ('?x=' + Math.random()) : ''),
					headers: {
						Authorization: 'Bearer ' + ($auth.getToken() || $cookies.get('token'))
					}
				}).then(function (response) {
					var user = response.data

					user.rating = user.rating || 1
					user.color = user.color || 'bronze'
					user.xp = user.xp || 0
					user.followers = user.followers || 0
					user.following = user.following || 0
					// user.avatar = user.avatar || '/assets/images/avatar_placeholder.png'

					var avatarImg = new Image()
					avatarImg.onload = function () {
						angular.element(avatarImg).data('loaded', true)
					}
					avatarImg.src = user.avatar
					$timeout(function () {
						if (!angular.element(avatarImg).data('loaded')) {
							user.avatar = '/assets/images/avatar_placeholder.png'
						}
					}, 500)

					if (user.role) {
						user.role = user.role.charAt(0).toUpperCase() + user.role.slice(1)
					}

					user.contact = user.contact || {email: '', phone: '', skype: '', linkedin: '', fb: ''}

					_user = user

					if (localStorage.rememberLogin && localStorage.rememberLogin != 'false') {
						// $cookies.putObject('user', user, {expires: new Date(Date.now() + (168 * 3600 * 1000))})
					} else {
						// $cookies.putObject('user', user)
					}

					$cookies.put('token', $auth.getToken())

					d.resolve(user)
					return user
				}, function (error) {
					d.reject(error.message)
					return error
				})
			}

			return d.promise
		},
		clean: function () {
			_user = undefined
			this.otherCache = {}
		},
		updateSettings: function (data) {
			return $http({
				method: 'POST',
				url: '/profile/edit/settings',
				headers: {
					Authorization: 'Bearer ' + ($auth.getToken() || $cookies.get('token'))
				},
				data: data
			}).then(function (response) {
				return response.data
			}, function (error) {
				return error
			})
		},
		isPasswordValid: function (password) {
			return $http({
				method: 'POST',
				url: '/profile/settings/isPasswordValid',
				headers: {
					Authorization: 'Bearer ' + ($auth.getToken() || $cookies.get('token'))
				},
				data: {
					password: password
				},
			}).then(function (response) {
				return response.data.valid
			}, function (error) {
				return error
			})
		},
		updatePassword: function (oldPassword, newPassword) {
			return $http({
				method: 'POST',
				url: '/profile/settings/setPassword',
				headers: {
					Authorization: 'Bearer ' + ($auth.getToken() || $cookies.get('token'))
				},
				data: {
					oldPassword: oldPassword,
					newPassword: newPassword,
				},
			}).then(function (response) {
				return response.data
			}, function (error) {
				return error
			})
		},
		disconnectSocial: function (provider) {
			return $http({
				method: 'POST',
				url: '/profile/settings/disconnectsocial',
				headers: {
					Authorization: 'Bearer ' + ($auth.getToken() || $cookies.get('token'))
				},
				data: {
					provider: provider,
				},
			}).then(function (response) {
				return response.data
			}, function (error) {
				return error
			})
		},
		updateNotifications: function (data) {
			return $http({
				method: 'POST',
				url: '/profile/settings/notifications',
				headers: {
					Authorization: 'Bearer ' + ($auth.getToken() || $cookies.get('token'))
				},
				data: data,
			}).then(function (response) {
				return response.data
			}, function (error) {
				return error
			})
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

			return $http({
				method: 'GET',
				url: '/article/all',
				cache: false,
				headers: {
					'Authorization': $cookies.get('token') || 'guest',
				},
				params: params,
			})
			.then(function (result) {
				var articles = result.data

				return articles
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

			return $http({
				method: 'GET',
				url: '/article/feed?r=' + Math.random(),
				cache: false,
				headers: {
					'Authorization': $cookies.get('token'),
				},
				params: params
			})
			.then(function (result) {
				var articles = result.data
				return articles
			}, function (data, status) {
				return data
			})
		},
		reacted: function (user, type) {
			return $http({
				method: 'GET',
				url: '/article/feed/' + type,
				cache: false,
				headers: {
					'Authorization': $cookies.get('token'),
				},
				params: {
					user: user
				}
			})
			.then(function (result) {
				return result.data
			}, function (data, status) {
				return data
			})
		},
	}
})
.factory('postService', function ($http, $cookies, $timeout) {
	return {
		get: function (id) {
			return $http({
				method: 'GET',
				url: '/article/one',
				headers: {
					'Authorization': $cookies.get('token'),
				},
				params: {
					id: id
				}
			})
			.then(function (result) {
				return result.data
			}, function (data, status) {
				return data
			})
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
			return $http({
				method: 'POST',
				url: '/article/remove',
				headers: {
					'Authorization': $cookies.get('token'),
				},
				data: {
					article: postId
				}
			}).then(function (result) {
				return result.data
			}, function (error) {
				return error
			})
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

				return $http({
					method: 'GET',
					url: '/article/comment/get/few',
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
		}
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
.factory('followService', function ($http, $cookies, identityService) {
	return {
		isFollowing: function (following) {
			return $http({
				method: 'GET',
				url: '/follow/isFollowing',
				headers: {
					'Authorization': $cookies.get('token'),
				},
				params: {
					following: following
				},
			})
			.then(function (result) {
				return result.data.isFollowing
			}, function (data, status) {
				return data
			})
		},
		follow: function (following) {
			return $http({
				method: 'POST',
				url: '/follow/follow',
				headers: {
					'Authorization': $cookies.get('token'),
				},
				data: {
					following: following
				},
			})
			.then(function (result) {
				// identityService._user.reactions.following++
				// if (identityService.otherCache[following]) identityService.otherCache[following].reactions.followers++

				return result.data.isFollowing
			}, function (data, status) {
				return data
			})
		},
		unfollow: function (following) {
			return $http({
				method: 'POST',
				url: '/follow/unfollow',
				headers: {
					'Authorization': $cookies.get('token'),
				},
				data: {
					following: following
				},
			})
			.then(function (result) {
				// identityService._user.reactions.following--
				// if (identityService.otherCache[following]) identityService.otherCache[following].reactions.followers++

				return result.data.isFollowing
			}, function (data, status) {
				return data
			})
		},
		following: function (follower, skip, limit, sort) {
			if (sort) {
				sort = sort.join('|')
			}

			return $http({
				method: 'GET',
				url: '/follow/following',
				headers: {
					'Authorization': $cookies.get('token'),
				},
				params: {
					follower: follower,
					skip: skip,
					limit: limit,
					sort: sort,
				},
			})
			.then(function (result) {
				return result.data.map(function (person) {
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

			return $http({
				method: 'GET',
				url: '/follow/followers',
				headers: {
					'Authorization': $cookies.get('token'),
				},
				params: {
					following: following,
					skip: skip,
					limit: limit,
					sort: sort,
				},
			})
			.then(function (result) {
				return result.data.map(function (person) {
					var follower = person.follower
					Object.assign(follower, {isFollowing: person.isFollowing})

					return follower
				})
			}, function (data, status) {
				return data
			})
		},
		unread: function () {
			return $http({
				method: 'GET',
				url: '/follow/unread',
				headers: {
					'Authorization': $cookies.get('token'),
				},
			})
			.then(function (result) {
				return result.data.count
			}, function (data, status) {
				return data
			})
		},
		setReadForUser: function () {
			return $http({
				method: 'POST',
				url: '/follow/setreadall',
				headers: {
					'Authorization': $cookies.get('token'),
				},
			})
			.then(function (result) {
				return result.data
			}, function (data, status) {
				return data
			})
		},
	}
})
.factory('piecesService', function ($http, $cookies) {
	return {
		get: function () {
			return $http({
				method: 'GET',
				url: '/article/pieces',
				headers: {
					'Authorization': $cookies.get('token'),
				},
			})
			.then(function (result) {
				return result.data
			}, function (data, status) {
				return data
			})
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

				return $http({
					method: 'GET',
					url: '/article/comment/reactions/few',
					headers: {
						'Authorization': $cookies.get('token'),
					},
					params: {
						commentIds: commentIds.join(',')
					}
				})
				.then(function (result) {
					var reactions = result.data

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
			return $http({
				method: 'GET',
				url: '/article/comment/reactions',
				headers: {
					'Authorization': $cookies.get('token'),
				},
				params: {
					comment: commentId
				}
			})
			.then(function (result) {
				return result.data
			}, function (data, status) {
				return data
			})
		},
		react: function (commentId, type) {
			return $http({
				method: 'POST',
				url: '/article/comment/react',
				headers: {
					'Authorization': $cookies.get('token'),
				},
				data: {
					comment: commentId,
					type: type
				},
			})
			.then(function (result) {
				return result
			}, function (data, status) {
				return data
			})
		},
		unreact: function (commentId, type) {
			return $http({
				method: 'DELETE',
				url: '/article/comment/react',
				headers: {
					'Authorization': $cookies.get('token'),
				},
				params: {
					comment: commentId,
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
	return {
		get: function () {
			return $http({
				method: 'GET',
				url: '/static/countries/grouped',
			})
			.then(function (result) {
				return result.data
			}, function (data, status) {
				return data
			})
		}
	}


	// return function (code) {
	// 	var d = $q.defer()

	// 	// $http.post('/auth/findaccount/signin', {code: code}).then(function (response) {
	// 	// 	d.resolve(response.data)
	// 	// }, function (error) {
	// 	// 	d.reject(error.data.message)
	// 	// })

	// 	var response = [
	// 		{id: 1, title: 'North America', sub: [
	// 			{id: 2, title: 'United States'},
	// 			{id: 3, title: 'Canada'},
	// 			{id: 4, title: 'Mexico'},
	// 		]},
	// 		{id: 5, title: 'Central & South America', sub: [
	// 			{id: 6, title: 'Brazil'},
	// 			{id: 7, title: 'Chile'},
	// 			{id: 8, title: 'Argentina'},
	// 		]}
	// 	]

	// 	d.resolve(response)

	// 	return d.promise
	// }
})
.factory('notificationService', function ($http, $cookies) {
	return {
		list: [],
		get: function () {
			var self = this

			return $http({
				method: 'GET',
				url: '/n/get?r=' + Math.random(),
				headers: {
					'Authorization': $cookies.get('token'),
				},
			})
			.then(function (result) {
				self.list = result.data
				console.log(result.data)
				return result.data
			}, function (data, status) {
				return data
			})
		},
		setReadForUser: function () {
			return $http({
				method: 'POST',
				url: '/n/setreadall',
				headers: {
					'Authorization': $cookies.get('token'),
				},
			})
			.then(function (result) {
				return result.data
			}, function (data, status) {
				return data
			})
		},
		// setRead: function (ids) {
		// 	return $http({
		// 		method: 'POST',
		// 		url: '/n/setreadm',
		// 		headers: {
		// 			'Authorization': $cookies.get('token'),
		// 		},
		// 	})
		// },
	}
})
.factory('questionsService', function ($http, $cookies) {
	return {
		add: function (recipient, text) {
			return $http({
				method: 'POST',
				url: '/questions/create',
				headers: {
					'Authorization': $cookies.get('token'),
				},
				data: {
					recipient: recipient,
					text: text,
				},
			})
			.then(function (result) {
				return result.data
			})
		},
		cancel: function (id) {
			return $http({
				method: 'POST',
				url: '/questions/settype',
				headers: {
					'Authorization': $cookies.get('token'),
				},
				data: {
					question: id,
					type: 'cancelled',
				},
			})
			.then(function (result) {
				return result.data
			})
		},
		list: [],
		get: function (user, skip, limit) {
			var self = this
			var params = {}

			if (user) params.user = user
			if (skip) params.skip = skip
			if (limit) params.limit = limit

			return $http({
				method: 'GET',
				url: '/questions/all',
				headers: {
					'Authorization': $cookies.get('token'),
				},
				params: params,
			})
			.then(function (result) {
				self.list = result.data
				return result.data
			})
		}
	}
})