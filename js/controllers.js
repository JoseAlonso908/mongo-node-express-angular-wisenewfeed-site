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
	identityService().then(function (user) {
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
		$cookies.remove('user')
		$auth.logout()

		$auth.authenticate(provider)
		.then(function (response) {
			identityService().then(function (user) {
				$scope.user = user
				$location.url('/my')
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
				validatePhoneService($scope.signup.phone).then(function (response) {
					callback()
				}, function (error) {
					callback(error)
				})
			}
		], function (err) {
			if (err) $scope.signup.error = err
			else {
				confirmAccountModal.activate({$parent: $scope, phone: $scope.signup.phone})
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
		$cookies.remove('user')
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
				})
			}
		}

		$scope.signup.role = role

		$auth.signup($scope.signup).then(function (response) {
			console.log(response)
			localStorage.satellizer_token = response.data.token
			$location.url('/')
		}).catch(function (response) {
			alert("Signup failed due to: " + response.data.message)
		})
	}
})
.controller('homeController', function ($scope, $timeout, categoriesService, groupedCountriesService, identityService, feedService) {
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

	identityService().then(function (user) {
		$scope.user = user
	})

	$scope.feedLoading = true
	$scope.feed = []
	feedService.then(function (feed) {
		$scope.feed = feed
		$scope.feedLoading = false
		$scope.$apply()
	})
})
.controller('profileController', function ($scope, $location, identityService, feedService) {
	$scope.wallpaperStyle = {}

	identityService().then(function (user) {
		$scope.user = user

		if ($scope.user.wallpaper) {
			$scope.wallpaperStyle = {'background-image': 'url(' + user.wallpaper + ')}'}
		}
		
		$scope.feedLoading = true
		$scope.feed = []
		feedService.then(function (feed) {
			$scope.feed = feed
			$scope.feedLoading = false
			$scope.$apply()
		})
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