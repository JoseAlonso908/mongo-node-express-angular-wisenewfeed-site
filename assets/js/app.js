angular.module('er', ['ui.router', 'ngSanitize', 'angularMoment', 'er.controllers', 'er.services', 'er.directives'])
.config(['$urlRouterProvider', '$stateProvider',
	function config($urlRouterProvider, $stateProvider) {
		$urlRouterProvider.hashPrefix('!')

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