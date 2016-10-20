angular.module('er.controllers', [])
.controller('startController', function ($scope, $auth, $location) {
	$scope.authenticate = function (provider) {
		$auth.authenticate(provider)
		.then(function (response) {
			$location.path('/')
		})
		.catch(function (response) {
			alert('Unable to authenticate')
		})
	}
})
.controller('homeController', function ($scope, $timeout, categoriesDropdown, countriesDropdown, dropdowns, identityService, feedService) {
	$scope.cats = categoriesDropdown
	$scope.countries = countriesDropdown

	$scope.r_tags = ['Tag 1', 'Tag 2', 'Tag 3', 'Tag 4', 'Tag 5']
	$scope.r_people = ['Guy 1', 'Guy 2', 'Guy 3', 'Guy 4', 'Guy 5', 'Guy 6', 'Guy 7']
	$scope.r_categories = ['Category 1', 'Category 2', 'Category 3', 'Category 4']

	identityService.then(function (user) {
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

	identityService.then(function (user) {
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