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
	countriesListService.countries().then(function (list) {
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


	if ($scope.signup) {
        $scope.signup.phone = '+' + $scope.signup.country.code + $scope.signup.phone
        $scope.signup.country = $scope.signup.country.country
    }

	$scope.extra = {title: '', company: '', field: ''}
	$scope.extraError = {title: '', company: '', field: ''}

    $scope.goExpertExtendedForm = function () {
        $location.url('/beta/expert')
    }
    $scope.goJournalistExtendedForm = function () {
        $location.url('/beta/journalist')
    }

	$scope.doSignup = function (role) {
		var roles = ['journalist', 'user']
		if (roles.indexOf(role) === -1) return false

		if (role == 'journalist') {
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
.controller('friendsFeedController', function ($scope, $rootScope, fieldsListService, groupedCountriesService, identityService) {
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
.controller('profilePeopleController', function ($rootScope, $routeParams, $scope, identityService, followService,
	friendshipService, groupedCountriesService, countriesListService) {

	$scope.type = $routeParams.type
	$scope.feedType = 'people'
	$scope.id = $routeParams.id

	if (['friends','following', 'followers'].indexOf($scope.type) > -1) {
		$scope.country
		$scope.setCountry = function (item) {
			$scope.country = item
			setCitiesList(item)
			// loadFriends()
		}

		groupedCountriesService.get().then(function (result) {
			$scope.countries = result
			$scope.setCountry(result[0])
		})

		$scope.city
		$scope.setCity = function (item) {
			$scope.city = item
			// loadFriends()
		}

		var setCitiesList = function (country) {
			countriesListService.cities(country.title).then(function (cities) {
				cities = cities.map(function (city, index) {
					return {id: (index + 1), title: city}
				})

				if (cities.length > 0) {
					cities.unshift({id: 0, title: 'All'})
				}

				$scope.cities = cities
				$scope.setCity(cities[0])
			})
		}

		$scope.setGender = function (item) {
			$scope.gender = item
			// loadFriends()
		}

		$scope.genders = [
			{id: '', title: 'Any'},
			{id: 'male', title: 'Male'},
			{id: 'female', title: 'Female'},
		]

		$scope.gender = $scope.genders[0]
	}

	var loadProfile = function (callback) {
		identityService.getOther($scope.id).then(function (profile) {
			if (!$scope.profile) {
				$scope.profile = profile
			} else {
				$scope.profile.reactions = profile.reactions
			}

			async.parallel([
				function (next) {
                    followService.isFollowing($scope.profile._id).then(function (result) {
						$scope.profile.isFollowing = result
						next()
					})
				},
				function (next) {
                    friendshipService.isFriend($scope.profile._id).then(function (result) {
                        $scope.profile.friendship = result
                        next()
                    })
				}
            ], callback)
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

	var loadFriends = function () {
		friendshipService.list($scope.id, {
			country: ($scope.country && $scope.country.id != 0) ? $scope.country.title : undefined,
			city: ($scope.city && $scope.city.id != 0) ? $scope.city.title : undefined,
			gender: ($scope.gender && $scope.gender.id != 0) ? $scope.gender.id : undefined,
		}).then(function (friends) {
			$scope.people = friends
		})
	}

	var loadFollowsPeople = function (cb) {
		if ($scope.type == 'friends') {
			loadFriends()
		} else {
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
.controller('personController', function ($routeParams, $scope, $location, identityService, followService, friendshipService) {
	$scope.type = 'own'
    identityService.getOther($routeParams.id).then(function (profile) {
        if (!$scope.profile) {
            $scope.profile = profile
        } else {
            $scope.profile.reactions = profile.reactions
        }

        async.parallel([
            function (next) {
                followService.isFollowing($scope.profile._id).then(function (result) {
                    $scope.profile.isFollowing = result
                    next()
                })
            },
            function (next) {
                friendshipService.isFriend($scope.profile._id).then(function (result) {
                    $scope.profile.friendship = result
                    next()
                })
            },
			function (next) {
                identityService.get().then(function (user) {
                    $scope.user = user
                    next()
                }, next)
            }
        ], function () {
        })
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
	$scope.close = function () {
        $location.url('/my')
    }

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
		$scope.user = Object.assign({}, user)

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
                nickname: e.target.nickname.value,
				email: e.target.email.value,
				phone: e.target.phone.value,
				country: $scope.user.country,
				city: $scope.user.city,
				field: $scope.user.field,
				language: e.target.language.value,
				gender: $scope.user.gender,
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

	$scope.cities = []

	$scope.countryChosen = function () {
		$scope.loadingCities = true
		countriesListService.cities($scope.user.country).then(function (list) {
			$scope.cities = list
			$scope.loadingCities = false
		})
	}

	async.series([
		function (next) {
			identityService.get().then(function (user) {
				$scope.user = user

				if (!$scope.user.email) {
					$scope.emailerror = 'You email address is required to use Expert Reaction.'
				}

				if (!$scope.user.phone) {
					$scope.phoneerror = 'You phone number is required to use Expert Reaction.'
				}

				next()
			})
		},
		function (next) {
			countriesListService.countries().then(function (list) {
				$scope.countries = list.map(function (item) {
					return item.country
				})

				console.log($scope.user.country)
				$scope.countryChosen($scope.user.country)

				next()
			})
		},
		function (next) {
			fieldsListService.get().then(function (list) {
				$scope.fields = list

				next()
			})
		},
	], function () {
		// $scope.$apply()
	})
})
.controller('questionsController', function ($routeParams, $rootScope, $scope, $location, $anchorScroll, $timeout, identityService, questionsService) {
	$scope.id = $routeParams.id
	$scope.qid = $routeParams.qid

	$scope.questions = []
	$scope.chosenFilter
	$scope.types = {
		replied: 0,
		cancelled: 0,
		active: 0,
	}
	$scope.visibleQuestionsCount = 0

	$scope.setFilter = function (filter) {
		$scope.chosenFilter = filter
		$scope.recalcQuestionsCounter()

		$scope.$broadcast('rebuild-questions-box')
	}
	$scope.rateComparator = function (v1, v2) {
		var value1 = v1.value
		var value2 = v2.value
		if (value1 && value1.hasOwnProperty('likes') && value1.hasOwnProperty('dislikes') && value2 && value2.hasOwnProperty('likes') && value2.hasOwnProperty('dislikes')) {
            var v1Rate = value1.likes - value1.dislikes
            var v2Rate = value2.likes - value2.dislikes
            return (v1Rate < v2Rate) ? -1 : 1
		} else {
            return false
        }
    }

	$scope.recalcQuestionsCounter = function () {
		$scope.visibleQuestionsCount = 0

		if (!$scope.chosenFilter) {
			$scope.visibleQuestionsCount = $scope.questions.length
		} else {
			for (var i in $scope.questions) {
				if ($scope.questions[i].type == $scope.chosenFilter) {
					$scope.visibleQuestionsCount++
				}
			}
		}
	}

	$scope.maxlength = 250
	$scope.question = {
		text: ''
	}

	$scope.loading = false

	$scope.replyMode = false
	$scope.replyingTo

	$scope.askQuestion = function () {
		$scope.loading = true
		$scope.questions = []

		questionsService.add($scope.id, $scope.question.text).then(function () {
			$scope.question.text = ''
			$scope.loading = false
			loadQuestions()
		})

		$scope.recalcQuestionsCounter()
	}

	$scope.cancel = function (question) {
		if ($scope.replyingTo && question._id == $scope.replyingTo._id) {
			$scope.replyingTo = undefined
		}

		questionsService.cancel(question._id).then(function () {
			loadQuestions($scope.recalcQuestionsCounter)
		})
	}

	$scope.reply = function (text) {
		$scope.loading = true
		questionsService.reply($scope.replyingTo._id, text).then(function () {
			$scope.loading = false

			$scope.replyingTo.response = text
			$scope.replyingTo.type = 'replied'
			$scope.replyingTo = null

			$scope.replyMode = false

			loadQuestions($scope.recalcQuestionsCounter)
		})

		$scope.question.text = ''
	}

	$scope.react = function (question, type) {
		questionsService.react(question._id, type).then(function (data) {
            question.youdid[type] = true
			question.reactions.likes = data.counts.likes
            question.reactions.dislikes = data.counts.dislikes
            question.youdid.like = data.youdid.like
            question.youdid.dislike = data.youdid.dislike

			$rootScope.$emit('updateQuestionsCounters')
		})
	}

    $scope.unreact = function (question, type) {
        questionsService.unreact(question._id, type).then(function (data) {
            question.youdid[type] = false
            question.reactions.likes = data.counts.likes
            question.reactions.dislikes = data.counts.dislikes
			question.youdid.like = data.youdid.like
            question.youdid.dislike = data.youdid.dislike

            $rootScope.$emit('updateQuestionsCounters')
        })
    }

	$scope.setReplyMode = function (question) {
		$scope.replyMode = true
		$scope.replyingTo = question
		$scope.question.text = ''
	}

	var loadQuestions = function (callback) {
		$scope.types = {
			replied: 0,
			cancelled: 0,
			active: 0,
		}

		questionsService.get($scope.id).then(function (questions) {
			var done = function () {
				$scope.$broadcast('rebuild-questions-box')
				if (typeof callback === 'function') callback()
			}

			if ($scope.questions.length > 0) {
				for (var i in questions) {
					var newq = questions[i]

					$scope.types[newq.type]++

					for (var j in $scope.questions) {
						var oldq = $scope.questions[j]

						if (newq._id == oldq._id) {
							oldq.liked = newq.liked
							oldq.likes = newq.likes
							oldq.type = newq.type
							oldq.response = newq.response
						}
					}
				}

				done()
			} else {
				$scope.questions = questions

				for (var i in $scope.questions) {
					var question = $scope.questions[i]

					$scope.types[question.type]++
				}

				$scope.visibleQuestionsCount = $scope.questions.length

				done()
			}
		})
	}

	$rootScope.$on('updateQuestionsCounters', loadQuestions)

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
		$timeout(function () {
			if ($scope.qid) {
				// $location.hash('q' + $scope.qid)
				$anchorScroll('q' + $scope.qid)
			}
		}, 500)
	})
})
.controller('searchController', function ($rootScope, $scope, $routeParams, fieldsListService, groupedCountriesService, identityService) {
	$routeParams.query = decodeURIComponent($routeParams.query)

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
				$scope.countries = result
				$scope.chosenCountry = result[0]
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
				$scope.categories = result
				$scope.chosenCategory = result[0]
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
.controller('chatController', function ($scope, $rootScope, $timeout, $routeParams, identityService, followService, messagesService) {
	$scope.hideLoadMore = false

	$scope.chatssearch = ''
	$scope.chatChosen = false
	$scope.loading = false

	$scope.chatMessages = []
	$scope.skip = 0
	$scope.limit = 20

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
	}

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
		if (!document.querySelector('.chat .messages-box-wrapper .messages')) return
		document.querySelector('.chat .messages-box-wrapper').scrollTop = document.querySelector('.chat .messages-box-wrapper .messages').scrollHeight
	}

	$rootScope.$on('scrollbar-redraw', function (e, element, top) {
		if (top == 0 && !$scope.hideLoadMore) {
			$scope.loadMore()
		}
	})

	$scope.loadMore = function () {
		console.log('load more')

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
			$scope.selectedMessages = $scope.selectedMessages.map(function (m) {
				m.hidden = true
				return m
			})
			$scope.selectedMessages = []

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

	$scope.makeChatsInactive = function () {
		for (var i in $scope.chats) {
			$scope.chats[i].active = false
		}

		$scope.activeChat = undefined
	}

	$scope.sendMessage = function () {
		var text = $scope.text.trim()

		if (!text && $scope.files.length == 0) return

		var fileObjects = $scope.files.map(function (file) {
			return file.fileObject
		})

		messagesService.sendMessage($scope.activeChat._id, text, fileObjects).then(function (result) {
			$scope.chatMessages.push(result)
			$scope.text = ''
			$scope.files = []

			$scope.activeChat.lastMessageId = result._id
			$scope.activeChat.lastMessage = result.text
			$scope.activeChat.lastMessageTime = result.createdAt

			$scope.reorderConversations()

			$timeout(function () {$scope.$broadcast('rebuild-chat-messages-bottom')})
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
					if (messages[i].to._id == $scope.user._id) {
						messages[i].read = true
					}
				}
			})

			if ($scope.chatMessages.length == 0) {
				$scope.chatMessages = messages.reverse()
			} else {
				for (var i in messages) {
					var newMessage = messages[i]
					$scope.chatMessages.unshift(newMessage)
				}
			}

			$scope.$broadcast('rebuild-chat-messages')

			if (typeof callback === 'function') callback(messages)
		})
	}

	$scope.setActive = function (user) {
		if (user.active) return

		$scope.skip = 0
		$scope.chatMessages = []
		$scope.loading = true

		for (var i in $scope.chats) {
			$scope.chats[i].active = false
		}

		user.active = true
		$scope.activeChat = user
		// $scope.activeChat.read = true

		$scope.loadMessages(function () {
			$scope.chatChosen = true
			$scope.hideLoadMore = false
			$scope.skip = 0
			$scope.loading = false

			$timeout(function () {$scope.$broadcast('rebuild-chat-messages-bottom')}, 50)
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

		identityService.searchusers(searchTerm, null, 0, 3).then(function (users) {
			users = users.filter(function (person) {
				for (var i in $scope.chats) {
					var existingUser = $scope.chats[i]

					if (existingUser._id == person._id) return false
					else continue
				}

				return true
			})

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

	$scope.$on('$destroy', function () {
		console.info('SCOPE DESTROYING')
		window.socket.disconnect()
		window.socket = undefined
	})

	var init = function () {
		async.series({
			user: function (next) {
				identityService.get().then(function (user) {
					$scope.user = user

					$rootScope.$on('ws-ready', function () {
						console.log('ws-ready 2')
						window.socket.on('message', function (message) {
							console.log('message received')
							console.log(message)
							console.log($scope.activeChat)
							console.log($scope.chats)

							if ($scope.activeChat && message.from._id == $scope.activeChat._id) {
								$scope.chatMessages.push(message)

								messagesService.setRead([message._id]).then(function () {
									message.read = true
								})

								$timeout($scope.scrollBottom)
							}

							for (var i in $scope.chats) {
								var c = $scope.chats[i]

								if (c._id == message.from._id) {
									console.log($scope.chats[i])

									$scope.chats[i].lastMessageId = message._id
									$scope.chats[i].lastMessage = message.text
									$scope.chats[i].lastMessageTime = message.createdAt
									$scope.chats[i].read = message.read
								}
							}

							$timeout(function () {$scope.$broadcast('rebuild-chat-messages-bottom')})
							$scope.reorderConversations()
							$scope.$digest()
						})

						window.socket.on('messagesread', function (messagesIds) {
							console.log('messages read')
							console.log(messagesIds)

							for (var i in messagesIds) {
								var readId = messagesIds[i]

								for (var j in $scope.chatMessages) {
									var m = $scope.chatMessages[j]

									if (m._id == readId) {
										m.read = true
										break
									}
								}

								for (var j in $scope.chats) {
									var m = $scope.chats[j]

									if (m && m.lastMessageId == readId) {
										m.read = true
										break
									}
								}
							}

							$scope.$apply()
						})
					})

					if (window.socket && window.socket.connected) {
						$rootScope.$broadcast('ws-ready')
					}

					next()
				})
			},
			conversations: function (next) {
				$scope.chats = []

				messagesService.getConversations().then(function (conversations) {
					for (var i in conversations) {
						var c = conversations[i]

						var person = (c.from._id == $scope.user._id) ? c.to : c.from
						person.lastMessageId = c._id
						person.lastMessage = c.text
						person.lastMessageTime = c.createdAt
						person.read = c.read
						person.role = person.role[0].toUpperCase() + person.role.substr(1)

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

						if (alreadyIn || person.role == 'user') continue

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

						if (alreadyIn || person.role == 'user') continue

						person.role = person.role[0].toUpperCase() + person.role.substr(1)
						$scope.chats.push(person)
					}

					next()
				})
			},
		}, function (err) {
			$scope.reorderConversations()

			if ($routeParams.user) {
				var inChat = false
				for (var i in $scope.chats) {
					var user = $scope.chats[i]

					if (user._id == $routeParams.user) {
						inChat = true
						$scope.setActive(user)
						break
					}
				}

				if (!inChat) {
					identityService.getOther($routeParams.user).then(function (user) {
						user.visible = true
						$scope.chats.unshift(user)
						$scope.setActive(user)
					})
				}
			}


			console.log($scope.chats)

			// whoop
			for (var i in $scope.chats) {
				$scope.chats[i].visible = true
			}
		})
	}

	init()
})
.controller('usersListController', function ($scope, $rootScope, $routeParams, identityService, followService) {
	angular.element(window).on('scroll', function (e) {
		if (window.scrollY + document.documentElement.clientHeight > document.documentElement.scrollHeight - 30 && !$scope.loading && $scope.canLoadMore) {
			$scope.init()
		}
	})

	identityService.get().then(function (user) {
		$scope.user = user
	})

	$scope.start = 0
	$scope.limit = 15
	$scope.canLoadMore = true
	$scope.people = []

	$scope.init = function () {
		$scope.loading = true

		identityService.searchusers('', $routeParams.role, $scope.start, $scope.limit).then(function (users) {
			if (users.length == 0) {
				$scope.canLoadMore = false
			}

			if ($scope.start == 0) {
				$scope.people = users
			} else {
				for (var i in users) {
					$scope.people.push(users[i])
				}
			}

			$scope.start += $scope.limit
			$scope.loading = false
		})
	}

	$scope.init()
})
.controller('profilePhotosController', function ($scope, $routeParams, identityService) {
	var loadImages = function (callback) {
		$scope.images = undefined

		identityService.images($routeParams.id).then(function (images) {
			$scope.images = images

			if (typeof callback == 'function') callback()
		})
	}

	var loadProfile = function (callback) {
		async.parallel([
			function (next) {
				identityService.getOther($routeParams.id).then(function (profile) {
					$scope.profile = profile
					next()
				})
			},
			loadImages,
		], callback)
	}

	$scope.files = []

	var fileFileInput = document.querySelector('input[name=image]')
	angular.element(fileFileInput).on('change', function (e) {
		e.stopImmediatePropagation()

		var reader = new FileReader()
		var file = e.target.files[0]

		if (['image/jpeg', 'image/png'].indexOf(file.type) === -1) {
			return
		}

		reader.addEventListener('load', function () {
			$scope.$apply(function () {
				$scope.file = {
					base64: reader.result,
					fileObject: file
				}

				var progress = function (e) {
					console.log(e)
				}

				identityService.addImages([$scope.file.fileObject], progress).then(function (result) {
					$scope.file = {}
					$scope.loading = false

					loadImages()
				}).catch(function (error) {
					console.error(error)
					$scope.loading = false
				})

				// Reset form to clean file input. This will
				// let us upload the same file
				angular.element(e.target).parent()[0].reset()
			})
		})

		reader.readAsDataURL(file)
	})

	$scope.upload = function () {

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
	])
})
.controller('betaController', function ($scope, $rootScope, $routeParams, betaUploadsService, $timeout, identityService) {
    $scope.errors = {}
    var availableRoles = ['expert', 'journalist']
	var selectedRole = 'expert'
	if ($routeParams.role && availableRoles.indexOf($routeParams.role) > -1) {
    	selectedRole = $routeParams.role
	}

    $scope.signup = {
        role: selectedRole,
        contacts: [],
        certificates: [{title: '', file: '', id: 'cert_' + Date.now().toString()}],
        experience: [{from: '', to: '', place: '', id: 'exp_' + Date.now().toString()}],
		additional: [{title: '', file: '', id: 'addon_' + Date.now().toString()}]
    }

    identityService.get().then(function (user) {
        $scope.user = user

		Object.assign($scope.signup, {
			name: user.name,
			info: user.intro,
			email: user.email,
			phone: user.phone,
			title: user.position,
			company: user.company,
			title: user.title,
			linkedin: user.contact.linkedin,
            facebook: user.contact.fb,
		})
    })

    $scope.attachCertificate = function (event, item) {
		var certificateFileInput = angular.element(event.target).parents('.input-group').children('input[type=file]')
		angular.element(certificateFileInput).on('change', function (e) {
			e.stopImmediatePropagation()
			$scope.$apply(function () {
				var file = e.target.files[0]
				item.title = file.name;
				betaUploadsService.addCert(file).then(function (result) {
					$scope.signup.certificates[$scope.signup.certificates.length -1].file = result.data.file
				}).catch(function (error) {
					console.log(error);
					alert('Error while uploading file. File size should be lower than 5 megabytes.')
				})
			})
		})

        $timeout(function () {
            certificateFileInput.click()
        }, 0)
    }

    $scope.removeCertificate = function (cert) {
        betaUploadsService.removeCert(cert).then(function (result) {
            console.log(result);
        }).catch(function (error) {
            console.log(error);
        })
    }

    $scope.attachDownload = function (event, item) {
        var certificateFileInput = angular.element(event.target).parents('.input-group').children('input[type=file]')
        angular.element(certificateFileInput).on('change', function (e) {
            e.stopImmediatePropagation()

            $scope.$apply(function () {
                var file = e.target.files[0]
                item.title = file.name;
                betaUploadsService.addDownload(file).then(function (result) {
                    $scope.signup.additional[$scope.signup.additional.length -1].file = result.data.file
                }).catch(function (error) {
                    console.log(err);
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
        betaUploadsService.removeDownload(file).then(function (result) {
        //	TODO: handle
            console.log(result);
        }).catch(function (error) {
            console.log(error);
        })
    }

    $scope.addMoreCertificates = function () {
        var lastCert = $scope.signup.certificates[$scope.signup.certificates.length - 1]
        if (lastCert.title && lastCert.file) {
            $scope.signup.certificates.push({title: '', file: '', id: 'cert_' + Date.now().toString()})
            $scope.errors.certificateFillRequired = false
		} else {
            $scope.errors.certificateFillRequired = true
		}
    }
    $scope.removeCertificate = function (item) {
        var originalCertificates = $scope.signup.certificates;
        if (originalCertificates.length > 1) {
            for (var i = 0; i < originalCertificates.length; i++) {
                if (originalCertificates[i] && originalCertificates[i].id === item.id) {
                    originalCertificates.splice(i, 1)
                }
            }
        } else {
            $scope.signup.certificates[0] = {title: '', file: '', id: 'cert_' + Date.now().toString()};
        }

    }

    $scope.addMoreExperience = function () {
        var lastExperience = $scope.signup.experience[$scope.signup.experience.length - 1]
        if (lastExperience.place && lastExperience.from && lastExperience.to) {
            $scope.errors.experienceFillRequried = false
            $scope.signup.experience.push({from: '', to: '', place: '', id: 'exp_' + Date.now().toString()})
        } else {
            $scope.errors.experienceFillRequried = true
            return false
        }
    }

    $scope.removeExperience = function (item) {
        var originalExperience = $scope.signup.experience
		if (originalExperience.length > 1) {
            for (var i = 0; i < originalExperience.length; i++) {
                if (originalExperience[i] && originalExperience[i].id === item.id) {
                    originalExperience.splice(i, 1)
                }
            }
		} else {
            $scope.signup.experience[0] = {from: '', to: '', place: '', id: 'exp_' + Date.now().toString()}
		}
    }

    $scope.addMoreContacts = function () {
        if ($scope.signup.contacts.length >= 5) {
            $scope.errors.contactsLimit = true
            return false
        }
        $scope.errors.contactsLimit = false
        $scope.signup.contacts.push('')
    }

    $scope.removeContact = function (item) {
        var contacts = $scope.signup.contacts;
        for (var i = 0; i < contacts.length; i++) {
            if (contacts[i] && contacts[i] === item) {
                contacts.splice(i, 1)
            }
        }
    }

    $scope.addMoreAdditional = function () {
        var last = $scope.signup.additional[$scope.signup.additional.length - 1]
        if (last.title && last.file) {
            $scope.errors.additionalFillRequried = false
            $scope.signup.additional.push({title: '', file: '', id: 'addon_' + Date.now().toString()})
        } else {
            $scope.errors.additionalFillRequried = true
        }
    }
    $scope.removeAdditional = function (item) {
        var additional = $scope.signup.additional;
        if (additional.length > 1) {
            for (var i = 0; i < additional.length; i++) {
                if (additional[i] && additional[i].id === item.id) {
                    additional.splice(i, 1)
                }
            }
        } else {
            $scope.signup.additional[0] = {title: '', file: '', id: 'addon_' + Date.now().toString()};
        }
    }



    $scope.sendForm = function (event) {
        identityService.get().then(function (user) {
            $scope.user = user

			// User authenticated, upgrade
			betaUploadsService.upgrade($scope.signup).
			then(function (result) {
				$scope.$apply(function () {
					$scope.submitClass = 'success'
					$scope.submitResult = 'Your request successfully sent'
				})
			}).catch(function (err) {
				$scope.$apply(function () {
					$scope.submitClass = 'error'
					$scope.submitResult = (err.data.message) ? err.data.message : 'Failed to submit your request'
				})
			})
        }, function (error) {
        	// User is not authenticated
			betaUploadsService.signup($scope.signup).
			then(function (result) {
				$scope.$apply(function () {
					$scope.submitClass = 'success'
					$scope.submitResult = 'Your request successfully sent'
				})
			}).catch(function (err) {
				$scope.$apply(function () {
					$scope.submitClass = 'error'
					$scope.submitResult = (err.data.message) ? err.data.message : 'Failed to submit your request'
				})
			})
        })


    }
})
.controller('writeController', function ($scope, $timeout, $location, $rootScope, postService, piecesService, $compile, identityService) {
    identityService.get().then(function (user) {
        if (!user || user.role === 'User') {
            return $location.url('/')
        }
    })
	/*TODO: Add select privacy functionality */
	$scope.privacy = 'Stranger'
    $scope.fonts = [
		'Liberation',
		'Arial',
		'Times',
		'Roboto',
		'Courier New',
	]

	$scope.command = function (command, value) {
		$timeout(function () {
			var attributes = [command, false]
			if (value) attributes.push(value)

			document.execCommand.apply(document, attributes)
        })
	}

	$scope.fontListVisible = false
	$scope.showFontList = function (e) {
		e.preventDefault()
		e.stopImmediatePropagation()

        $scope.fontListVisible = true
	}

	angular.element('body').on('click', function (e) {
		$scope.fontListVisible = false
	})

	angular.element('.font-list').on('click', function (e) {
		e.stopImmediatePropagation()
	})

	$scope.setFont = function (e, font) {
        e.preventDefault()
        e.stopImmediatePropagation()

		$scope.command('fontName', font)
        $scope.fontListVisible = false
	}

    $scope.create = function () {
		// console.log($scope.title)
		// console.log($scope.text)
		// console.log($scope.textHtml)
		// console.log($scope)
		// return

        if ($scope.loading) return
        $scope.loading = true

        var fileObjects = $scope.files.map(function (file) {
            return file.fileObject
        })

        var progress = function () {}
        postService.create({
            title: $scope.title,
            text: $scope.textHtml,
            files: fileObjects,
            privacy: $scope.privacy
        }, progress).then(function (result) {
            $scope.$parent.$apply(function () {
                $scope.text = ''
                $scope.files = []
				//TODO: reset privacy option too

                return $location.url('/')
            })
        }).catch(function (error) {
            console.error(error)
            $scope.loading = false
        })
    }

    $scope.title = ''
    $scope.text = ''
	$scope.textHtml = ''
    $scope.files = []

    $scope.addImage = function () {
        if ($scope.loading) return

        var fileFileInput = document.querySelector('input[type=file]')
        angular.element(fileFileInput).on('change', function (e) {
            e.stopImmediatePropagation()

            var reader = new FileReader()
            var file = e.target.files[0]

			if (file.size > 5 * 1024 * 1024) {
            	return alert('Image size should be less than 5 MB')
			}

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
        if ($scope.loading) return

        $scope.files = $scope.files.filter(function (file, fileIndex) {
            if (index == fileIndex) return false
            return true
        })
    }

    var ce = document.querySelector('[contenteditable]')

    $scope.acDo = function (item) {
        $scope.acFocusedNode.textContent = item

        var selection = rangy.getSelection()
        selection.removeAllRanges()

        var range = rangy.createRange()
        range.selectNode($scope.acFocusedNode)
        range.collapse()

        selection.setSingleRange(range)
        $(ce).trigger('input')
        console.log('refocused 3')

        $scope.acFocusedNode = null
        $scope.acVisible = false
        $scope.acList = []
    }

    angular.element(ce).on('keydown', function (e) {
        if (!$scope.acVisible || $scope.acList.length == 0) return

        if ([9, 13, 38, 40].indexOf(e.keyCode) !== -1) {
            switch (e.keyCode) {
                case 9:
                case 13:
                    angular.element(document.querySelector('.aclist')).find('.item.active').triggerHandler('click');
                    break
                case 38:
                    if ($scope.acActive > 0) {
                        $scope.acActive--
                    } else {
                        $scope.acActive = $scope.acList.length - 1
                    }
                    break
                case 40:
                    if ($scope.acActive < $scope.acList.length - 1) {
                        $scope.acActive++
                    } else {
                        $scope.acActive = 0
                    }
                    break
            }

            e.preventDefault()
        }
    })

    $scope.autocomplete = function (e) {
        if ([9, 13, 38, 40].indexOf(e.keyCode) !== -1) return

        var savedSelection = rangy.saveSelection(ce)
        var bookmark = angular.element(document.querySelector('#' + savedSelection.rangeInfos[0].markerId))
        bookmark.css('display', '')
        var pxOffset = bookmark.offset()
        rangy.removeMarkers(savedSelection)

        var selection = rangy.getSelection(ce)

        var focus = {
            node: selection.nativeSelection.focusNode,
            offset: selection.nativeSelection.focusOffset - 1,
        }

        if (focus.node.parentElement.tagName !== 'TAG' || !selection.isCollapsed) {
            $scope.acVisible = false
            return
        }

        $scope.acVisible = true

        piecesService.search(focus.node.textContent).then(function (result) {
            $scope.acList = result
            $scope.acActive = 0
        })


        $scope.acPosition = pxOffset
        $scope.acFocusedNode = focus.node

        if (!document.querySelector('.aclist')) {
            console.log('No ac list')
            var aclistElement = angular.element(
                '<div class="aclist" ng-class="{visible: (acVisible && acList.length > 0)}" ng-style="{top: acPosition.top + \'px\', left: acPosition.left +\'px\'}">' +
                '<div class="item" ng-class="{active: acActive == $index}" ng-click="acDo(item)" ng-repeat="item in acList">' +
                '<div class="title">{{item}}</div>' +
                '<div class="checked"><i class="material-icons">check</i></div>' +
                '</div>' +
                '</div>'
            )
            aclistElement.appendTo(document.body)

            $compile(aclistElement)($scope)
        }
    }
})

