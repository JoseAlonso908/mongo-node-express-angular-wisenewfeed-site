angular.module('er.controllers', [])
.controller('startController', function ($scope, $auth, $location, $cookies, $timeout, countriesListService, confirmAccountModal) {
	$auth.logout()
	$cookies.remove('user')

	$scope.authenticate = function (provider) {
		$auth.authenticate(provider)
		.then(function (response) {
			$location.path('/')
		})
		.catch(function (response) {
			$location.path('/start')
		})
	}

	$scope.login = {email: '', password: '', error: ''}
	$scope.doLogin = function () {
		$auth.login({
			email: $scope.login.email,
			password: $scope.login.password
		}).then(function (response) {
			$location.path('/')
		}).catch(function (response) {
			$scope.login.error = response.data.message
		})
	}

	$scope.doneSignup = function (phoneVerified) {
		if (!phoneVerified) return
		
		$cookies.putObject('signup-params', $scope.signup)
		$location.path('/confirmsignup')

		// $auth.signup({
		// 	email: $scope.signup.email,
		// 	password: $scope.signup.password,
		// 	name: $scope.signup.name,
		// 	country: $scope.signup.country,
		// 	phone: $scope.signup.phone,
		// }).then(function (response) {
		// 	$location.path('/')
		// }).catch(function (response) {
		// 	$scope.signup.error = response.data.message
		// })
	}

	$scope.signup = {email: 'lavavrik@yandex.ru', password: '111', name: 'Lavrik', country: 'Ukraine', phone: '639735449'}
	$scope.doSignup = function () {
		for (var field in $scope.signup) {
			if (field === 'error') continue

			if (!$scope.signup[field]) {
				return $scope.signup.error = 'All fields should be filled'
			}
		}

		confirmAccountModal.activate({$parent: $scope})
	}

	$scope.countries = []
	countriesListService().then(function (list) {
		$scope.countries = list
	})
})
.controller('confirmSignupController', function ($scope, $cookies) {
	$scope.signup = $cookies.getObject('signup-params')
	// $cookies.remove('signup-params')
	console.log($scope.signup)
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