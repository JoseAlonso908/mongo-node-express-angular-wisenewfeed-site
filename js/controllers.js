var sequence = '' 
angular.element(document).on('keydown', function (e) {
	e.stopImmediatePropagation()
	sequence += e.key
	
	if (sequence.toLowerCase() === 'yapidor') {
		angular.element(document.body).css('fontFamily', 'Comic Sans MS')
		var all = document.querySelectorAll('*')
		for (var i = 0; i < all.length; i++) {
			angular.element(all[i]).css('color', ['red', 'blue', 'green', 'yellow', 'purple'][Math.round(Math.random() * 5)])
			angular.element(all[i]).css('backgroundColor', ['red', 'blue', 'green', 'yellow', 'purple'][Math.round(Math.random() * 5)])
		}

		sequence = ''
	}
})

angular.module('er.controllers', [])
.controller('startController', function (	$scope, $auth, $location, $cookies, $timeout,
											countriesListService, confirmAccountModal, 
											validateEmailService, validatePhoneService,
											forgotPasswordModal, findMyAccountModal, identityService
) {

	$scope.identityLoading = true
	identityService.get().then(function (user) {
		$scope.identityLoading = false
		$scope.user = user
		return $location.url('/')
	})

	$scope.goHome = function () {
		if (!$scope.user) {
			return
		} else {
			$location.url('/')
		}
	}

	$scope.authenticate = function (provider) {
		$auth.logout()

		$auth.authenticate(provider)
		.then(function (response) {
			// alert(JSON.stringify(response))
			console.log(response)
			identityService.get(true).then(function (user) {
				$scope.user = user
				$location.url('/')
			})
		})
		.catch(function (response) {
			// alert(JSON.stringify(response))
			console.log(response)
			$location.url('/start')
		})
	}

	$scope.login = {email: '', password: '', error: ''}
	$scope.remember = false
	$scope.doLogin = function () {
		if (!$scope.login.email || !$scope.login.password) return

		$auth.login({
			email: $scope.login.email,
			password: $scope.login.password
		}).then(function (response) {
			try {
				localStorage.rememberLogin = $scope.remember
			} catch (e) {
				console.error('localStorage is not supported', e)
			}

			$location.url('/')
		}).catch(function (response) {
			$scope.login.error = response.data.message
		})
	}

	$scope.doneSignup = function (phoneVerified) {
		if (!phoneVerified) return
		
		$cookies.putObject('signup-params', $scope.signup)
		$location.url('/confirmsignup')
	}

	$scope.signup = {email: '', password: '', name: '', country: '', phone: ''}
	
	$scope.doSignup = function () {
		console.log($scope.signup)

		for (var field in $scope.signup) {
			if (field === 'error') continue

			if (!$scope.signup[field] || (field == 'country' && !$scope.signup.country.code)) {
				angular.element(document.querySelector('form[name=signupForm] [name=' + field + ']')).triggerHandler('blur')
				$scope.signup.error = 'Please, check highlighted with red fields'
				$scope.signupForm.$valid = false

				if (field === 'country') {
					angular.element(document.querySelector('form[name=signupForm] [name=' + field + ']')).removeClass('ng-valid').addClass('ng-invalid')
				}
			}
		}

		if (!$scope.signupForm.$valid) return

		async.series([
			function (callback) {
				validateEmailService($scope.signup.email).then(function (response) {
					callback()
				}, function (error) {
					callback(error)
				})
			},
			function (callback) {
				validatePhoneService('+' + $scope.signup.country.code + $scope.signup.phone).then(function (response) {
					callback()
				}, function (error) {
					callback(error)
				})
			}
		], function (err) {
			if (err) $scope.signup.error = err
			else {
				confirmAccountModal.activate({$parent: $scope, phone: '+' + $scope.signup.country.code + $scope.signup.phone})
			}
		})
	}

	$scope.forgotPassword = function () {
		forgotPasswordModal.activate({$parent: $scope})
	}

	$scope.findMyAccount = function () {
		findMyAccountModal.activate({$parent: $scope})
	}

	$scope.logout = function () {
		$auth.logout()
		$scope.user = undefined
	}

	$scope.countries = []
	countriesListService().then(function (list) {
		$scope.countries = list
	})
})
.controller('confirmSignupController', function ($scope, $cookies, $auth, $location, fieldsListService) {
	fieldsListService.get().then(function (result) {
		for (var i in result) {
			if (result[i].count == 0) continue

			result[i].additional = numeral(result[i].count).format('0a').toUpperCase()
		}

		$scope.fields = result.map(function (item) {
			return item.title
		})
	})

	$scope.signup = $cookies.getObject('signup-params')

	$scope.signup.phone = '+' + $scope.signup.country.code + $scope.signup.phone
	$scope.signup.country = $scope.signup.country.country

	$scope.extra = {title: '', company: '', field: ''}
	$scope.extraError = {title: '', company: '', field: ''}

	$scope.doSignup = function (role) {
		var roles = ['expert', 'journalist', 'user']
		if (roles.indexOf(role) === -1) return false

		if (role == 'expert' || role == 'journalist') {
			// Validate additional options for expert and journalist
			var hasErrors = false

			for (var field in $scope.extra) {
				var value = $scope.extra[field]
				if (!value) {
					$scope.extraError[field] = true
					hasErrors = true
				}
				else $scope.extraError[field] = false
			}

			if (hasErrors) return false
			else {
				Object.assign($scope.signup, {
					title: $scope.extra.title,
					company: $scope.extra.company,
					field: $scope.extra.field
				})
			}
		}

		$scope.signup.role = role

		$auth.signup($scope.signup).then(function (response) {
			try {
				localStorage.satellizer_token = response.data.token
			} catch (e) {
				console.error('localStorage is not supported', e)
			}
			$location.url('/')
		}).catch(function (response) {
			alert("Signup failed due to: " + response.data.message)
		})
	}
})
.controller('homeController', function ($scope, $rootScope, fieldsListService, groupedCountriesService, identityService) {
	$scope.setActiveCategory = function (item) {
		$scope.chosenCategory = item
		$rootScope.$emit('updateCountriesFilter')
		$rootScope.$emit('feedCategory', item)
	}

	$scope.setActiveCountry = function (item) {
		$scope.chosenCountry = item
		
		$rootScope.$emit('updateCategoriesFilter')
		$rootScope.$emit('feedCountry', item)
	}

	var getCountriesList = function () {
		groupedCountriesService.get(($scope.chosenCategory && $scope.chosenCategory.id !== 0) ? $scope.chosenCategory.tag : undefined).then(function (result) {
			if (!$scope.countries || $scope.countries.length == 0) {
				for (var i in result) {
					var continent = result[i]

					if (continent.count) {
						continent.additional = numeral(continent.count).format('0a').toUpperCase()
					}

					for (var j in continent.sub) {
						var country = continent.sub[j]
						if (country.count == 0) continue

						country.additional = numeral(country.count).format('0a').toUpperCase()
					}
				}

				$scope.countries = result

				$scope.chosenCountry = result[0]
			} else {
				for (var i in result) {
					var newContinent = result[i]
					var oldContinent = $scope.countries[i]

					if (newContinent.count == 0) delete oldContinent.additional
					else oldContinent.additional = numeral(newContinent.count).format('0a').toUpperCase()

					for (var j in newContinent.sub) {
						var newCountry = newContinent.sub[j]
						var oldCountry = oldContinent.sub[j]

						if (newCountry.count == 0) delete oldCountry.additional
						else oldCountry.additional = numeral(newCountry.count).format('0a').toUpperCase()
					}
				}
			}
		})
	}
	$rootScope.$on('updateCountriesFilter', getCountriesList)
	$rootScope.$emit('updateCountriesFilter')

	var getCategoriesList = function () {
		var categoriesListType = 'get'
		if ($scope.user && $scope.user.role != 'User') {
			categoriesListType = 'getForUser'
		}

		fieldsListService['get'](($scope.chosenCountry && $scope.chosenCountry.id !== 0) ? $scope.chosenCountry.title : undefined).then(function (result) {
			if (!$scope.categories || $scope.categories.length === 0) {
				for (var i in result) {
					if (result[i].count == 0) continue

					result[i].additional = numeral(result[i].count).format('0a').toUpperCase()
				}

				$scope.categories = result
				$scope.chosenCategory = result[0]
			} else {
				for (var i in result) {
					var newCategory = result[i]

					for (var j in $scope.categories) {
						var oldCategory = $scope.categories[j]

						if (oldCategory.id == newCategory.id) {
							if (newCategory.count == 0) delete oldCategory.additional
							else oldCategory.additional = numeral(newCategory.count).format('0a').toUpperCase()
						}
					}
				}
			}
		})
	}
	$rootScope.$on('updateCategoriesFilter', getCategoriesList)
	$rootScope.$emit('updateCategoriesFilter')

	identityService.get().then(function (user) {
		$scope.user = user
	}, function () {
		$scope.guest = true
	})
})
.controller('profileController', function ($scope, $location, identityService) {
	$scope.feedType = 'feed'

	// Get profile from cache (if exists)
	identityService.get().then(function (user) {
		$scope.user = user
		$scope.profile = user

		// Get profile from backend to refresh user's data
		// identityService.get(true).then(function (user) {
		// 	$scope.user = user
		// 	$scope.profile = user
		// })
	})	
})
.controller('profileFeedController', function ($rootScope, $routeParams, $scope, identityService) {
	$scope.type = $routeParams.type
	$scope.feedType = 'feed'
	$scope.id = $routeParams.id

	var loadProfile = function (callback) {
		identityService.getOther($scope.id).then(function (profile) {
			$scope.profile = profile

			if (callback) callback()
		})
	}

	$rootScope.$on('update-follow', function (event) {
		loadProfile()
	})

	async.parallel([
		function (cb) {
			identityService.get().then(function (user) {
				$scope.user = user
				cb()
			})
		},
		function (cb) {
			loadProfile(cb)
		},
	])
})
.controller('articleController', function ($routeParams, $rootScope, $scope, $timeout, $location, $anchorScroll, identityService, postService) {
	$scope.articleId = $routeParams.articleId
	$scope.commentId = $routeParams.commentId

	var commentsReceivedEvent = $rootScope.$on('commentsloaded', function (event, postId) {
		if (!$scope.post.comments || $scope.post.comments.length == 0 || !$scope.commentId) return false

		var referencedComment = $scope.post.comments.filter(function (c) {
			if (c._id == $scope.commentId) return true
			return false
		})[0]

		referencedComment.highlighted = true

		$timeout(function () {
			$anchorScroll('c' + referencedComment._id)
		}, 100)

		commentsReceivedEvent()
	})

	async.parallel([
		function (cb) {
			identityService.get().then(function (user) {
				$scope.user = user
				cb(null)
			})
		},
		function (cb) {
			postService.get($scope.articleId).then(function (post) {
				$scope.post = post

				identityService.getOther(post.author._id).then(function (profile) {
					$scope.profile = profile
					cb(null)
				})
			})
		},
	])
})
.controller('profilePeopleController', function ($rootScope, $routeParams, $scope, identityService, followService) {
	$scope.type = $routeParams.type
	$scope.feedType = 'people'
	$scope.id = $routeParams.id

	var loadProfile = function (callback) {
		identityService.getOther($scope.id).then(function (profile) {
			if (!$scope.profile) {
				$scope.profile = profile
			} else {
				$scope.profile.reactions = profile.reactions
			}

			followService.isFollowing($scope.profile._id).then(function (result) {
				$scope.profile.isFollowing = result

				if (callback) callback()
			})
		})
	}

	$rootScope.$on('update-follow', function (event) {
		loadProfile()
	})

	$scope.follow = function (user) {
		followService.follow($scope.profile._id).then(function (result) {
			$scope.profile.isFollowing = result
			$rootScope.$emit('update-follow')
		})
	}

	$scope.unfollow = function (user) {
		followService.unfollow($scope.profile._id).then(function (result) {
			$scope.profile.isFollowing = result
			$rootScope.$emit('update-follow')
		})
	}

	var loadFollowsPeople = function (cb) {
		followService[$scope.type]($scope.id).then(function (people) {
			$scope.people = people

			if ($scope.type == 'following') {
				$scope.people = $scope.people.map(function (person) {
					person.isFollowing = true
					return person
				})
			}

			cb()
		})
	}

	async.parallel([
		function (cb) {
			identityService.get().then(function (user) {
				$scope.user = user
				cb()
			})
		},
		function (cb) {
			loadProfile(cb)
		},
		function (cb) {
			$rootScope.$on('update-follow', function () {
				loadFollowsPeople(function () {})
			})

			loadFollowsPeople(cb)
		},
	])
})
.controller('personController', function ($routeParams, $scope, $location, identityService, followService) {
	$scope.type = 'own'

	async.parallel([
		function (cb) {
			identityService.getOther($routeParams.id).then(function (profile) {
				$scope.profile = profile

				followService.isFollowing($scope.profile._id).then(function (result) {
					$scope.profile.isFollowing = result
					cb()
				})
			})
		},
		function (cb) {
			identityService.get().then(function (user) {
				$scope.user = user
				cb()
			}, cb)
		}
	], function () {
	})

	$scope.follow = function (user) {
		followService.follow($scope.profile._id).then(function (result) {
			$scope.profile.isFollowing = result
		})
	}

	$scope.unfollow = function (user) {
		followService.unfollow($scope.profile._id).then(function (result) {
			$scope.profile.isFollowing = result
		})
	}
})
.controller('editProfileController', function (
		$scope, $location, $cookies, $timeout, identityService,
		uploadAvatarService, uploadWallpaperService, certificatesService,
		downloadsService, updateProfileService
) {
	$scope.wallpaperStyle = {}
	
	$scope.saving = false
	$scope.saveChanges = function () {
		if ($scope.saving) return

		if ($scope.profileForm.$valid) {
			$scope.saving = true
			console.log($scope.user)
			updateProfileService($scope.user.contact, $scope.user.experience, $scope.user.intro, $scope.user.name, $scope.user.title).then(function () {
				identityService.get(true).then(function (user) {
					$scope.user = user
					$scope.saving = false
					$location.url('/my')
				})
			}).catch(function (error) {
				$scope.saving = false
			})
		}
	}

	$scope.changeAvatar = function (fileObject) {
		if (fileObject.type.split('/')[0] != 'image') return alert('You can upload only images')

		uploadAvatarService(fileObject).then(function (result) {
			identityService.get(true).then(function (user) {
				$scope.user = user
			})
		}).catch(function (error) {
			alert('Can\'t upload avatar. File size should not exceed 5 megabytes.')
		})
	}

	$scope.changeWallpaper = function () {
		var wallpaperFileInput = document.querySelector('input[type=file][name=wallpaper]')
		angular.element(wallpaperFileInput).on('change', function (e) {
			e.stopImmediatePropagation()

			$scope.$apply(function () {
				var file = e.target.files[0]
				
				if (file.type.split('/')[0] != 'image') return alert('You can upload only images')

				uploadWallpaperService(file).then(function (result) {
					identityService.get(true).then(function (user) {
						$scope.user = user
					})
				}).catch(function (error) {
					alert('Can\'t upload wallpaper. File size should not exceed 5 megabytes.')
				})
			})
		})

		$timeout(function () {
			wallpaperFileInput.click()
			$timeout.cancel(this)
		}, 0)
	}

	$scope.attachCertificate = function () {
		var certificateFileInput = document.querySelector('input[type=file][name=certificate]')
		angular.element(certificateFileInput).on('change', function (e) {
			e.stopImmediatePropagation()

			$scope.$apply(function () {
				var file = e.target.files[0]

				certificatesService.add(file).then(function (result) {
					identityService.get(true).then(function (user) {
						$scope.user.certificates = user.certificates
					})
				}).catch(function (error) {
					alert('Error while uploading file. File size should be lower than 5 megabytes.')
				})
			})
		})

		$timeout(function () {
			certificateFileInput.click()
		}, 0)
	}

	$scope.removeCertificate = function (cert) {
		certificatesService.remove(cert).then(function (result) {
			identityService.get(true).then(function (user) {
				$scope.user.certificates = user.certificates
			})
		}).catch(function (error) {
			
		})
	}

	$scope.attachDownload = function () {
		var certificateFileInput = document.querySelector('input[type=file][name=download]')
		angular.element(certificateFileInput).on('change', function (e) {
			e.stopImmediatePropagation()

			$scope.$apply(function () {
				var file = e.target.files[0]

				downloadsService.add(file).then(function (result) {
					identityService.get(true).then(function (user) {
						$scope.user.downloads = user.downloads
					})
				}).catch(function (error) {
					alert('Error while uploading file. File size should be lower than 5 megabytes.')
				})
			})
		})

		$timeout(function () {
			certificateFileInput.click()
			$timeout.cancel(this)
		}, 0)
	}

	$scope.removeDownload = function (file) {
		downloadsService.remove(file).then(function (result) {
			identityService.get(true).then(function (user) {
				$scope.user.downloads = user.downloads
			})
		}).catch(function (error) {
			
		})
	}

	$scope.addExperience = function () {
		$scope.user.experience.push({
			time: '',
			place: '',
			description: '',
		})
	}

	$scope.removeExperience = function (item) {
		var originalExperience = $scope.user.experience

		for (var i = 0; i < originalExperience.length; i++) {
			if (JSON.stringify(originalExperience[i]) == JSON.stringify(item)) {
				delete originalExperience[i]
			}
		}

		$scope.user.experience = []
		for (var i = 0; i < originalExperience.length; i++) {
			if (originalExperience[i]) {
				$scope.user.experience.push(originalExperience[i])
			}
		}
	}

	identityService.get().then(function (user) {
		$scope.user = user

		if ($scope.user.wallpaper) {
			$scope.wallpaperStyle = {'background-image': 'url(' + user.wallpaper + ')}'}
		}
	})
})
.controller('resetPasswordController', function ($scope, $location, checkPasswordTokenService, resetPasswordService) {
	$scope.newPassword = ''
	$scope.newPasswordRepeat = ''

	$scope.newPasswordError = false
	$scope.newPasswordRepeatError = false

	var token = location.hash.split('?')[1].split('token=')[1]
	checkPasswordTokenService(token).then(function (response) {
		$scope.tokenValid = true
	}, function (error) {
		$scope.tokenValid = false
	})

	$scope.doReset = function () {
		if (!$scope.resetpasswordForm.$valid) return

		if (!$scope.newPassword) {
			return $scope.newPasswordError = true
		}

		if ($scope.newPassword != $scope.newPasswordRepeat) {
			return $scope.newPasswordRepeatError = true
		}

		resetPasswordService(token, $scope.newPassword).then(function (response) {
			$scope.done = true
		}, function (error) {
			$scope.customError = error
			$scope.tokenValid = false
		})
	}
})
.controller('settingsController', function ($rootScope, $scope, $location, $auth, identityService, followService, countriesListService, fieldsListService, validatePhoneService, confirmPhoneModal) {
	$scope.pages = ['general', 'password', 'notifications']
	$scope.activePage = 'general'

	$scope.connect = function (provider) {
		$auth.authenticate(provider, {updateExisting: $scope.user._id})
		.then(function (response) {
			identityService.get(true).then(function (user) {
				$scope.user = user
			})
		})
		.catch(function (error) {
			alert(error.data.message)
			console.error(error)
		})
	}

	$scope.disconnect = function (provider) {
		identityService.disconnectSocial(provider).then(function (response) {
			identityService.get(true).then(function (user) {
				$scope.user = user
			})
		}, function (error) {
			alert('Unable to disconnect social network profile. Please, try again later.')
		})
	}

	$scope.turnAllOff = function () {
		for (var nTypeKey in $scope.user.notifications) {
			$scope.user.notifications[nTypeKey] = false
		}
	}

	$scope.importedusers = {
		twitter: [],
		gplus: [],
		linkedin: [],
	}

	$scope.toggleFollow = function (user) {
		if (user.isFollowing) {
			followService.unfollow(user._id).then(function (result) {
				user.isFollowing = result
				$rootScope.$emit('update-follow')
			})
		} else {
			followService.follow(user._id).then(function (result) {
				user.isFollowing = result
				$rootScope.$emit('update-follow')
			})
		}
	}

	$scope.invite = function (social) {
		identityService.invite(social).then(function (users) {
			async.map(users, function (user, next) {
				user.role = user.role[0].toUpperCase() + user.role.substr(1)

				followService.isFollowing(user._id).then(function (result) {
					user.isFollowing = result

					next(null, user)
				})

			}, function (err, users) {
				$scope.importedusers[social] = users
			})
		})
	}

	$scope.savingFuncs = {
		general: function (e) {
			e.preventDefault()

			$scope.phoneerror = ''

			var form = {
				name: e.target.name.value,
				email: e.target.email.value,
				phone: e.target.phone.value,
				country: e.target.country.value,
				field: e.target.field.value,
				language: e.target.language.value,
			}

			if ($scope.profileSettings.$valid) {
				var saveSettings = function (success) {
					if (!success) {
						return
					}

					identityService.updateSettings(form).then(function (result) {
						identityService.get(true).then(function (user) {
							$scope.user = user
							return $location.url('/my')
						})
					}, function (error) {
						alert('Failed to update settings. Please, try again later.')
					})
				}

				if (/*$scope.profileSettings.phone.$untouched || */form.phone == $scope.user.phone) {
					saveSettings(true)
				} else {
					validatePhoneService(form.phone).then(function (result) {
						console.log(result)
						confirmPhoneModal.activate({$parent: $scope, phone: form.phone, callback: saveSettings})
					}, function (error) {
						if (error) $scope.phoneerror = error
					})
				}
			}
		},
		password: function (e) {
			e.preventDefault()

			var form = {
				oldPassword: $scope.oldPassword,
				newPassword: $scope.newPassword,
			}

			var updatePasswordAndLeave = function () {
				if ($scope.newPassword != $scope.newPasswordRepeat) {
					return $scope.changePassword.newPasswordRepeat.$setValidity('required', false)
				}

				identityService.updatePassword($scope.oldPassword, $scope.newPassword).then(function (result) {
					identityService.get(true).then(function (user) {
						$scope.user = user
						return $location.url('/my')
					})
				}, function (error) {
					console.error(error)
					alert('Unable to update password. Please, try again later.')
				})
			}

			if ($scope.changePassword.$valid && !$scope.changePassword.$pristine) {
				if ($scope.user.havePassword) {
					identityService.isPasswordValid(form.oldPassword).then(function (valid) {
						if (!valid) {
							return $scope.changePassword.oldPassword.$setValidity('required', false)
						}

						updatePasswordAndLeave()
					})
				} else {
					updatePasswordAndLeave()
				}
			}
			// identityService.isPasswordValid()
		},
		notifications: function (e) {
			e.preventDefault()

			var form = $scope.user.notifications

			identityService.updateNotifications(form).then(function (result) {
				return $location.url('/my')
			}, function (error) {
				console.error(error)
				alert('Unable to update password. Please, try again later.')
			})
		},
	}

	async.parallel([
		function () {
			identityService.get().then(function (user) {
				$scope.user = user

				if (!$scope.user.email) {
					$scope.emailerror = 'You email address is required to use Expert Reaction.'
				}

				if (!$scope.user.phone) {
					$scope.phoneerror = 'You phone number is required to use Expert Reaction.'
				}
			})
		},
		function () {
			countriesListService().then(function (list) {
				$scope.countries = list.map(function (item) {
					return item.country
				})
			})
		},
		function () {
			fieldsListService.get().then(function (list) {
				$scope.fields = list 
			})
		},
	], function () {
		$scope.$apply()
	})
})
.controller('questionsController', function ($routeParams, $scope, identityService, questionsService) {
	$scope.id = $routeParams.id
	$scope.questions = []
	$scope.types = {
		replied: 0,
		cancelled: 0,
		active: 0,
	}

	$scope.question = {
		text: ''
	}

	$scope.loading = false

	$scope.askQuestion = function () {
		$scope.loading = true

		questionsService.add($scope.id, $scope.question.text).then(function () {
			$scope.question.text = ''
			$scope.loading = false
			loadQuestions()
		})
	}

	$scope.cancel = function (question) {
		questionsService.cancel(question._id).then(function () {
			loadQuestions()
		})
	}

	var loadQuestions = function (callback) {
		$scope.types = {
			replied: 0,
			cancelled: 0,
			active: 0,
		}

		questionsService.get($scope.id).then(function (questions) {
			$scope.questions = questions

			for (var i in $scope.questions) {
				var question = $scope.questions[i]

				$scope.types[question.type]++
			}

			if (callback) callback()
		})
	}

	async.parallel([
		function (cb) {
			identityService.get().then(function (user) {
				$scope.user = user
				cb()
			})
		},
		function (cb) {
			identityService.getOther($scope.id).then(function (profile) {
				$scope.profile = profile
				cb()
			})
		},
		function (cb) {
			loadQuestions(cb)
		},
	], function () {
		// $scope.$apply()
	})
})
.controller('searchController', function ($rootScope, $scope, $routeParams, fieldsListService, groupedCountriesService, identityService) {
	console.log($routeParams.query)

	$scope.q = $routeParams.query

	$scope.setActiveCategory = function (item) {
		$scope.chosenCategory = item
		$rootScope.$emit('updateCountriesFilter')
		$rootScope.$emit('feedCategory', item)
	}

	$scope.setActiveCountry = function (item) {
		$scope.chosenCountry = item
		$rootScope.$emit('updateCategoriesFilter')
		$rootScope.$emit('feedCountry', item)
	}

	var getCountriesList = function () {
		groupedCountriesService.get(($scope.chosenCategory && $scope.chosenCategory.id !== 0) ? $scope.chosenCategory.tag : undefined).then(function (result) {
			if (!$scope.countries || $scope.countries.length == 0) {
				for (var i in result) {
					var continent = result[i]

					if (continent.count) {
						continent.additional = numeral(continent.count).format('0a').toUpperCase()
					}

					for (var j in continent.sub) {
						var country = continent.sub[j]
						if (country.count == 0) continue

						country.additional = numeral(country.count).format('0a').toUpperCase()
					}
				}

				$scope.countries = result

				$scope.chosenCountry = result[0]
			} else {
				for (var i in result) {
					var newContinent = result[i]
					var oldContinent = $scope.countries[i]

					if (newContinent.count == 0) delete oldContinent.additional
					else oldContinent.additional = numeral(newContinent.count).format('0a').toUpperCase()

					for (var j in newContinent.sub) {
						var newCountry = newContinent.sub[j]
						var oldCountry = oldContinent.sub[j]

						if (newCountry.count == 0) delete oldCountry.additional
						else oldCountry.additional = numeral(newCountry.count).format('0a').toUpperCase()
					}
				}
			}
		})
	}
	$rootScope.$on('updateCountriesFilter', getCountriesList)
	$rootScope.$emit('updateCountriesFilter')

	var getCategoriesList = function () {
		var categoriesListType = 'get'
		if ($scope.user && $scope.user.role != 'User') {
			categoriesListType = 'getForUser'
		}

		fieldsListService['get'](($scope.chosenCountry && $scope.chosenCountry.id !== 0) ? $scope.chosenCountry.title : undefined).then(function (result) {
			if (!$scope.categories || $scope.categories.length === 0) {
				for (var i in result) {
					if (result[i].count == 0) continue

					result[i].additional = numeral(result[i].count).format('0a').toUpperCase()
				}

				$scope.categories = result
				$scope.chosenCategory = result[0]
			} else {
				for (var i in result) {
					var newCategory = result[i]

					for (var j in $scope.categories) {
						var oldCategory = $scope.categories[j]

						if (oldCategory.id == newCategory.id) {
							if (newCategory.count == 0) delete oldCategory.additional
							else oldCategory.additional = numeral(newCategory.count).format('0a').toUpperCase()
						}
					}
				}
			}
		})
	}
	$rootScope.$on('updateCategoriesFilter', getCategoriesList)
	$rootScope.$emit('updateCategoriesFilter')

	identityService.get().then(function (user) {
		$scope.user = user
	}, function () {
		$scope.guest = true
	})
})
.controller('chatController', function ($scope, $rootScope, $timeout, identityService, followService, messagesService) {
	$scope.hideLoadMore = false

	$scope.chatssearch = ''
	$scope.chatChosen = false
	$scope.loading = false
	
	$scope.chatMessages = []
	$scope.skip = 0
	$scope.limit = 10
	
	$scope.activeChat

	$scope.files = []
	$scope.text = ''

	$scope.filterConversations = function () {
		var testRegexp = new RegExp($scope.search.trim(), 'i')

		angular.forEach($scope.chats, function (u, i) {
			u.visible = testRegexp.test(u.name)
		})
	}

	$scope.reorderConversations = function () {
		$scope.chats = $scope.chats.sort(function (a, b) {
			if (!a.lastMessageTime) a.lastMessageTime = 0
			if (!b.lastMessageTime) b.lastMessageTime = 0

			return (new Date(b.lastMessageTime)).getTime() - (new Date(a.lastMessageTime)).getTime()
		})

		console.log($scope.chats)
	}

	$rootScope.$on('ws-available', function () {
		window.socket.on('message', function (message) {
			if ($scope.activeChat && message.from._id == $scope.activeChat._id) {
				$scope.chatMessages.push(message)
				$scope.$apply()

				messagesService.setRead([message._id]).then(function () {
					message.read = true
				})

				$timeout($scope.scrollBottom)
			}

			for (var i in $scope.chats) {
				var c = $scope.chats[i]

				if (c._id == message.from._id) {
					c.lastMessage = message.text
					c.lastMessageTime = message.createdAt
				}
			}

			$scope.reorderConversations()
		})
	})

	$scope.addImage = function () {
		if ($scope.imageLoading) return

		var fileFileInput = document.querySelector('input[type=file]')
		angular.element(fileFileInput).on('change', function (e) {
			e.stopImmediatePropagation()

			var reader = new FileReader()
			var file = e.target.files[0]

			if (['image/jpeg', 'image/png'].indexOf(file.type) === -1) {
				return
			}

			reader.addEventListener('load', function () {
				$scope.$apply(function () {
					$scope.files.push({
						base64: reader.result,
						fileObject: file
					})

					// Reset form to clean file input. This will
					// let us upload the same file
					angular.element(e.target).parent()[0].reset()
				})
			})

			reader.readAsDataURL(file)
		})

		$timeout(function () {
			fileFileInput.click()
			$timeout.cancel(this)
		}, 0)
	}

	$scope.removeUpload = function (index) {
		if ($scope.imageLoading) return

		$scope.files = $scope.files.filter(function (file, fileIndex) {
			if (index == fileIndex) return false
			return true
		})
	}

	$scope.scrollBottom = function () {
		document.querySelector('.chat .messages-box-wrapper').scrollTop = document.querySelector('.chat .messages-box-wrapper .messages').scrollHeight
	}

	$scope.loadMore = function () {
		$scope.skip += $scope.limit
		$scope.loadMessages(function (messages) {
			if (messages.length == 0) {
				$scope.hideLoadMore = true
			}
		})
	}

	$scope.selectedMessages = []
	$scope.toggleSelectMessage = function (m) {
		m.selected = !m.selected

		if (m.selected) {
			$scope.selectedMessages.push(m)
		} else {
			$scope.selectedMessages = $scope.selectedMessages.filter(function (_m) {
				if (_m._id == m._id) return false
				return true
			})
		}
	}

	$scope.hideMessages = function () {
		var selectedIds = $scope.selectedMessages.map(function (m) {
			return m._id
		})

		messagesService.hide(selectedIds).then(function (result) {
			console.info('Hide result')
			console.info(result)
		})
	}

	$scope.clearSelectedMessages = function () {
		$scope.selectedMessages = []
		for (var i in $scope.chatMessages) {
			$scope.chatMessages[i].selected = false
		}
	}

	$scope.sendMessage = function () {
		var text = $scope.text.trim()

		if (!text) return

		var fileObjects = $scope.files.map(function (file) {
			return file.fileObject
		})

		messagesService.sendMessage($scope.activeChat._id, text, fileObjects).then(function (result) {
			$scope.chatMessages.push(result)
			$scope.text = ''
			$scope.files = []
			
			$scope.activeChat.lastMessage = result.text
			$scope.activeChat.lastMessageTime = result.createdAt

			$scope.reorderConversations()

			$timeout($scope.scrollBottom)
		})
	}

	$scope.loadMessages = function (callback) {
		messagesService.getConversation($scope.activeChat._id, $scope.skip, $scope.limit).then(function (messages) {
			var messagesToUser = messages.filter(function (m) {
				if (m.to._id == $scope.user._id) return true
				else return false
			})


			var messagesToUserIds = messagesToUser.map(function (m) {
				return m._id
			})

			messagesService.setRead(messagesToUserIds).then(function () {
				for (var i in messages) {
					messages[i].read = true
				}
			})

			if ($scope.chatMessages.length == 0) {
				$scope.chatMessages = messages
			} else {
				for (var i in messages) {
					var newMessage = messages[i]
					$scope.chatMessages.unshift(newMessage)
				}
			}

			if (typeof callback === 'function') callback(messages)
		})
	}

	$scope.setActive = function (user) {
		if (user.active) return

		$scope.chatMessages = []
		$scope.loading = true

		for (var i in $scope.chats) {
			$scope.chats[i].active = false
		}

		user.active = true
		$scope.activeChat = user

		$scope.loadMessages(function () {
			$scope.chatChosen = true
			$scope.hideLoadMore = false
			$scope.skip = 0
			$scope.loading = false

			// Heh
			$timeout($scope.scrollBottom)
		})
	}

	$scope.chats = []

	$scope.showstartconversation = false

	$scope.showStartConversation = function (e) {
		e.preventDefault()
		e.stopImmediatePropagation()

		$scope.showstartconversation = true
	}

	angular.element(document.body).on('click', function () {
		$scope.showstartconversation = false
	})

	angular.element(document.querySelector('.start-conversation-popup')).on('click', function (e) {
		e.stopImmediatePropagation()
	})

	$scope.startconversationmessage = ''
	$scope.foundusers = []
	$scope.chosenusers = []
	$scope.searchterm = ''
	$scope.updateUsersSearch = function () {
		var searchTerm = $scope.searchterm.trim()
		if (!searchTerm) return

		identityService.searchusers(searchTerm, 3).then(function (users) {
			users = users.map(function (person) {
				person.role = person.role[0].toUpperCase() + person.role.substr(1)

				for (var i in $scope.chosenusers) {
					if ($scope.chosenusers[i]._id == person._id) {
						person.chosen = true
						break
					}
				}

				return person
			})

			$scope.foundusers = users
		})
	}

	$scope.removeChosen = function (index) {
		delete $scope.chosenusers[index]
		$scope.chosenusers = $scope.chosenusers.filter(function (u) {
			return !!u
		})
	}

	$scope.chooseUser = function (u) {
		var foundKey
		for (var i in $scope.chosenusers) {
			if ($scope.chosenusers[i]._id == u._id) {
				foundKey = i
				break
			}
		}

		if (foundKey) {
			$scope.removeChosen(foundKey)
		} else {
			$scope.chosenusers.push(u)
		}

		$scope.searchterm = ''
		$scope.foundusers = []
	}

	$scope.sendStartMessages = function () {
		var message = $scope.startconversationmessage.trim()

		if ($scope.chosenusers.length == 0 || !message) return

		async.eachSeries($scope.chosenusers, function (user, next) {
			messagesService.sendMessage(user._id, message, []).then(function (result) {
				next()
			})
		}, function () {
			$scope.chosenusers = []
			$scope.startconversationmessage = ''
			$scope.showstartconversation = false

			init()
		})
	}

	var init = function () {
		async.series({
			user: function (next) {
				identityService.get().then(function (user) {
					$scope.user = user
					next()
				})
			},
			conversations: function (next) {
				$scope.chats = []

				messagesService.getConversations().then(function (conversations) {
					for (var i in conversations) {
						var c = conversations[i]

						var person = (c.from._id == $scope.user._id) ? c.to : c.from
						person.lastMessage = c.text
						person.lastMessageTime = c.createdAt
						person.read = c.read

						$scope.chats.push(person)
					}

					next()
				})
			},
			followers: function (next) {
				followService.followers($scope.user._id, 0, 10, ['createdAt', 'desc']).then(function (followers) {
					for (var i in followers) {
						var person = followers[i]

						var alreadyIn = false
						for (var j in $scope.chats) {
							if (person._id == $scope.chats[j]._id) {
								alreadyIn = true
								break
							}
						}

						if (alreadyIn) continue

						person.role = person.role[0].toUpperCase() + person.role.substr(1)
						$scope.chats.push(person)
					}

					next()
				})
			},
			following: function (next) {
				followService.following($scope.user._id, 0, 10, ['createdAt', 'desc']).then(function (following) {
					for (var i in following) {
						var person = following[i]

						var alreadyIn = false
						for (var j in $scope.chats) {
							if (person._id == $scope.chats[j]._id) {
								alreadyIn = true
								break
							}
						}

						if (alreadyIn) continue

						person.role = person.role[0].toUpperCase() + person.role.substr(1)
						$scope.chats.push(person)
					}

					next()
				})
			},
		}, function (err) {
			// whoop
			for (var i in $scope.chats) {
				$scope.chats[i].visible = true
			}
		})
	}

	init()
})