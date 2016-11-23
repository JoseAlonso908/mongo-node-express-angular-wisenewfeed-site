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
											forgotPasswordModal, findMyAccountModal, identityService) {

	// $auth.logout()

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

	// $cookies.remove('user')

	$scope.authenticate = function (provider) {
		// $cookies.remove('user')
		$auth.logout()

		$auth.authenticate(provider)
		.then(function (response) {
			identityService.get().then(function (user) {
				$scope.user = user
				$location.url('/')
			})
		})
		.catch(function (response) {
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
			localStorage.rememberLogin = $scope.remember

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
	// $scope.signup = {email: 'lavavrik@yandex.ru', password: 'a12345678', name: 'Lavrik', country: 'Ukraine', phone: '+380639735449'}
	$scope.doSignup = function () {
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
		// $cookies.remove('user')
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
					position: $scope.extra.title,
					company: $scope.extra.company,
					field: $scope.extra.field
				})
			}
		}

		$scope.signup.role = role

		$auth.signup($scope.signup).then(function (response) {
			localStorage.satellizer_token = response.data.token
			$location.url('/')
		}).catch(function (response) {
			alert("Signup failed due to: " + response.data.message)
		})
	}
})
.controller('homeController', function ($scope, $rootScope, $timeout, fieldsListService, groupedCountriesService, identityService) {
	fieldsListService.get().then(function (result) {
		for (var i in result) {
			if (result[i].count == 0) continue

			result[i].additional = numeral(result[i].count).format('0a').toUpperCase()
		}

		result.unshift({
			id: 0,
			title: 'All'
		})

		$scope.categories = result
		$scope.chosenCategory = result[0]
	})

	$scope.setActiveCategory = function (item) {
		$scope.chosenCategory = item
		$rootScope.$emit('feedCategory', item)
	}

	groupedCountriesService.get().then(function (result) {
		result.unshift({
			id: 0,
			title: 'All'
		})

		$scope.countries = result
		$scope.chosenCountry = result[0]
	})

	$scope.setActiveCountry = function (item) {
		$scope.chosenCountry = item
		$rootScope.$emit('feedCountry', item)
	}

	identityService.get().then(function (user) {
		// Doesn't work without timeout
		$timeout(function() {
			// $scope.$apply()
			$scope.user = user
			$timeout.cancel(this)
		}, 0)
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
.controller('profileFeedController', function ($routeParams, $scope, identityService) {
	$scope.type = $routeParams.type
	$scope.feedType = 'feed'
	$scope.id = $routeParams.id

	async.parallel([
		function () {
			identityService.get().then(function (user) {
				$scope.user = user
			})
		},
		function () {
			identityService.getOther($scope.id).then(function (profile) {
				$scope.profile = profile
			})
		},
	])
})
.controller('profilePeopleController', function ($routeParams, $scope, identityService, followService) {
	$scope.type = $routeParams.type
	$scope.feedType = 'people'
	$scope.id = $routeParams.id

	async.parallel([
		function () {
			identityService.get().then(function (user) {
				$scope.user = user
			})
		},
		function () {
			identityService.getOther($scope.id).then(function (profile) {
				$scope.profile = profile
			})
		},
		function () {
			followService[$scope.type]($scope.id).then(function (people) {
				$scope.people = people

				if ($scope.type == 'following') {
					$scope.people = $scope.people.map(function (person) {
						person.isFollowing = true
						return person
					})
				}
			})
		},
	])
})
.controller('personController', function ($routeParams, $scope, $location, identityService, followService) {
	identityService.get().then(function (user) {
		identityService.getOther($routeParams.id).then(function (profile) {
			$scope.user = user
			$scope.profile = profile

			followService.isFollowing($scope.profile._id).then(function (result) {
				$scope.profile.isFollowing = result
			})
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
	$scope.saveChanges = function () {
		if ($scope.saving) return

		if ($scope.profileForm.$valid) {
			$scope.saving = true
			updateProfileService($scope.user.contact, $scope.user.experience, $scope.user.intro, $scope.user.name, $scope.user.position).then(function () {
				// $cookies.remove('user')
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
			// $cookies.remove('user')
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
					// $cookies.remove('user')
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
					// $cookies.remove('user')
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
			// $cookies.remove('user')
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
					// $cookies.remove('user')
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
			// $cookies.remove('user')
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
.controller('settingsController', function ($scope, $location, $auth, identityService, countriesListService, fieldsListService, confirmPhoneModal) {
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

	$scope.savingFuncs = {
		general: function (e) {
			e.preventDefault()

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
						return $location.url('/my')
					}, function (error) {
						alert('Failed to update settings. Please, try again later.')
					})
				}

				if (/*$scope.profileSettings.phone.$untouched || */form.phone == $scope.user.phone) {
					saveSettings(true)
				} else {
					confirmPhoneModal.activate({$parent: $scope, phone: form.phone, callback: saveSettings})
				}
			}
		},
		password: function (e) {
			e.preventDefault()

			var form = {
				oldPassword: $scope.oldPassword,
				newPassword: $scope.newPassword,
			}

			if ($scope.changePassword.$valid && !$scope.changePassword.$pristine) {
				identityService.isPasswordValid(form.oldPassword).then(function (valid) {
					if (!valid) {
						return $scope.changePassword.oldPassword.$setValidity('required', false)
					}

					if ($scope.newPassword != $scope.newPasswordRepeat) {
						return $scope.changePassword.newPasswordRepeat.$setValidity('required', false)
					}

					identityService.updatePassword($scope.oldPassword, $scope.newPassword).then(function (result) {
						return $location.url('/my')
					}, function (error) {
						console.error(error)
						alert('Unable to update password. Please, try again later.')
					})
				})
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