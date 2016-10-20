angular.module('er', ['ngRoute', 'ngSanitize', 'angularMoment', 'er.controllers', 'er.services', 'er.directives'])
.config(['$locationProvider', '$routeProvider',
	function config($locationProvider, $routeProvider) {
		$locationProvider.hashPrefix('!')

		$routeProvider
			.when('/start', {
				templateUrl: 'assets/views/landing.htm'
			})
			.when('/', {
				templateUrl: 'assets/views/home.htm'
			})
			.when('/my', {
				templateUrl: 'assets/views/profile.htm'
			})
	}
])
.run(function ($rootScope, $templateCache) {
	$templateCache.removeAll()
})