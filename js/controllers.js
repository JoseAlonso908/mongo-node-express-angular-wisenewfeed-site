angular.module('er.controllers', [])
.controller('startController', function (	$scope, $auth, $location, $cookies, $timeout,
											countriesListService, confirmAccountModal, 
											validateEmailService, validatePhoneService,
											forgotPasswordModal, findMyAccountModal, identityService) {

	// $auth.logout()

	$scope.identityLoading = true
	identityService().then(function (user) {
		$scope.identityLoading = true
		$scope.user = user
	})

	// $cookies.remove('user')

	$scope.authenticate = function (provider) {
		$cookies.remove('user')
		$auth.logout()

		$auth.authenticate(provider)
		.then(function (response) {
			console.log('Done.')
			console.log(response)
			$location.url('/')
		})
		.catch(function (response) {
			$location.url('/start')
		})
	}

	$scope.login = {email: '', password: '', error: ''}
	$scope.remember = false
	$scope.doLogin = function () {
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
	// $scope.signup = {email: 'lavavrik@yandex.ru', password: '111', name: 'Lavrik', country: 'Ukraine', phone: '+380639735449'}
	$scope.doSignup = function () {
		for (var field in $scope.signup) {
			if (field === 'error') continue

			if (!$scope.signup[field]) {
				return $scope.signup.error = 'All fields should be filled'
			}
		}

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

		console.log($scope.signup)

		$auth.signup($scope.signup).then(function (response) {
			$location.url('/start')
		}).catch(function (response) {
			alert("Signup failed due to: " + response.data.message)
		})
	}
})
.controller('homeController', function ($scope, $timeout, categoriesDropdown, countriesDropdown, dropdowns, identityService, feedService) {
	$scope.cats = categoriesDropdown
	$scope.countries = countriesDropdown

	$scope.r_tags = ['Tag 1', 'Tag 2', 'Tag 3', 'Tag 4', 'Tag 5']
	$scope.r_people = ['Guy 1', 'Guy 2', 'Guy 3', 'Guy 4', 'Guy 5', 'Guy 6', 'Guy 7']
	$scope.r_categories = ['Category 1', 'Category 2', 'Category 3', 'Category 4']

	identityService().then(function (user) {
		$scope.user = user

		$scope.feedLoading = true
		$scope.feed = []
		feedService.then(function (feed) {
			$scope.feed = feed
			$scope.feedLoading = false
			$scope.$apply()
		})
	})
})
.controller('profileController', function ($scope, identityService, feedService) {
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
		if (!$scope.newPassword) {
			return $scope.newPasswordError = true
		}

		if ($scope.newPassword != $scope.newPasswordRepeat) {
			return $scope.newPasswordRepeatError = true
		}

		resetPasswordService(token, $scope.newPassword).then(function (response) {
			$location.url('/start')
		}, function (error) {
			$scope.customError = error
			$scope.tokenValid = false
		})
	}
})