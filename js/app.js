// var angular = require('angular')
// require('angular-moment')

angular.module('er', ['ngRoute', 'ngSanitize', 'angularMoment', 'er.controllers', 'er.services', 'er.directives', 'satellizer'])
.config(['$locationProvider', '$routeProvider', '$authProvider',
// angular.module('er', [require('angular-route'), require('angular-sanitize'), 'angularMoment', require('satellizer'), 'er.controllers', 'er.services', 'er.directives'])
// .config(['$locationProvider', '$routeProvider', '$authProvider',
	function config($locationProvider, $routeProvider, $authProvider) {
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


		$authProvider.facebook({
			clientId: 685381251615066
		})
	}
])
.run(function ($rootScope, $templateCache) {
	$templateCache.removeAll()
})