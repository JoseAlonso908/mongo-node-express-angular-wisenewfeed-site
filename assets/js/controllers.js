angular.module('er.controllers', [])
.controller('homeController', function ($scope, $timeout, categoriesDropdown, countriesDropdown, dropdowns, identityService, feedService) {
	$scope.cats = categoriesDropdown
	$scope.countries = countriesDropdown

	$scope.r_tags = ['Tag 1', 'Tag 2', 'Tag 3', 'Tag 4', 'Tag 5']
	$scope.r_people = ['Guy 1', 'Guy 2', 'Guy 3', 'Guy 4', 'Guy 5', 'Guy 6', 'Guy 7']
	$scope.r_categories = ['Category 1', 'Category 2', 'Category 3', 'Category 4']

	identityService.then(function (user) {
		$scope.user = user
		$scope.$apply()
	})

	$scope.feedLoading = true
	$scope.feed = []
	feedService.then(function (feed) {
		$scope.feed = feed
		$scope.feedLoading = false
		$scope.$apply()
	})
})
.controller('profileController', function ($scope, identityService, feedService) {
	identityService.then(function (user) {
		$scope.user = user
		$scope.$apply()
	})

	$scope.feedLoading = true
	$scope.feed = []
	feedService.then(function (feed) {
		$scope.feed = feed
		$scope.feedLoading = false
		$scope.$apply()
	})
})