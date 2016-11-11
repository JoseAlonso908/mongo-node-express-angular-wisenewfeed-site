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

			if (!$scope.signup[field]) {
				angular.element(document.querySelector('form[name=signupForm] [name=' + field + ']')).triggerHandler('blur')
				$scope.signup.error = 'Please, check highlighted with red fields'
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
			console.log($scope.signup.country)

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
.controller('confirmSignupController', function ($scope, $cookies, $auth, $location) {
	$scope.fields = [
		'Field 1',
		'Field 2',
		'Field 3',
		'Field 4'
	]

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
.controller('homeController', function ($scope, $timeout, categoriesService, groupedCountriesService, identityService) {
	categoriesService().then(function (result) {
		for (var i in result) {
			result[i].additional = numeral(result[i].count).format('0a').toUpperCase()
		}

		$scope.categories = result
		$scope.chosenCategory = result[0]
	})

	$scope.setActiveCategory = function (item) {
		$scope.chosenCategory = item
	}

	groupedCountriesService().then(function (result) {
		$scope.countries = result
		$scope.chosenCountry = result[0].sub[0]
	})

	$scope.setActiveCountry = function (item) {
		$scope.chosenCountry = item
	}

	$scope.r_tags = ['Tag 1', 'Tag 2', 'Tag 3', 'Tag 4', 'Tag 5']
	$scope.r_people = ['Guy 1', 'Guy 2', 'Guy 3', 'Guy 4', 'Guy 5', 'Guy 6', 'Guy 7']
	$scope.r_categories = ['Category 1', 'Category 2', 'Category 3', 'Category 4']

	identityService.get().then(function (user) {
		// Doesn't work without timeout
		$timeout(function() {
			$scope.user = user
			$timeout.cancel(this)
		})
	})
})
.controller('profileController', function ($scope, $location, identityService) {
	$scope.wallpaperStyle = {}

	identityService.get().then(function (user) {
		$scope.user = user

		if ($scope.user.wallpaper) {
			$scope.wallpaperStyle = {'background-image': 'url(' + user.wallpaper + ')}'}
		}
	})
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
			console.log('Avatar change error')
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
					console.log('Wallpaper change error')
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
					console.log(error)
					alert(error.message)
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
					alert(error.message)
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