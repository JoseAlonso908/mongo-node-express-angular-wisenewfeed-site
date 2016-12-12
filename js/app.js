 var angular = require('angular')
require('angular-moment')
require('angular-modal')

window.numeral = require('numeral')
window.async = require('async')

// angular.module('er', ['ngRoute', 'ngSanitize', 'angularMoment', 'ngCookies', 'er.controllers', 'er.services', 'er.directives', 'satellizer'])
// .config(['$locationProvider', '$routeProvider', '$authProvider',
angular.module('er', [
	require('angular-route'), require('angular-animate'), require('angular-sanitize'), require('angular-cookies'), 'angularMoment', require('satellizer'),
	'localytics.directives', 'btford.modal',
	'er.controllers', 'er.services', 'er.directives', 'er.modals', 'er.filters'])
.config(['$locationProvider', '$routeProvider', '$authProvider', '$compileProvider',
	function config($locationProvider, $routeProvider, $authProvider, $compileProvider) {
		$compileProvider.debugInfoEnabled(false)
		$compileProvider.aHrefSanitizationWhitelist(/^\s*(http|https|javascript):/)

		$locationProvider.hashPrefix('!')
		$routeProvider
			.when('/start', {
				templateUrl: 'assets/views/landing.htm',
			})
			.when('/confirmsignup', {
				templateUrl: 'assets/views/confirm-signup.htm',
			})
			.when('/', {
				templateUrl: 'assets/views/home.htm',
			})
			.when('/my', {
				templateUrl: 'assets/views/profile.htm',
				controller: 'profileController',
			})
			.when('/profilefeed/:id/:type', {
				templateUrl: 'assets/views/profile.htm',
				controller: 'profileFeedController',
			})
			.when('/profilepeople/:id/:type', {
				templateUrl: 'assets/views/profile.htm',
				controller: 'profilePeopleController',
			})
			.when('/article/:articleId/:commentId?', {
				templateUrl: 'assets/views/post.htm',
				controller: 'articleController',
			})
			.when('/person/:id', {
				templateUrl: 'assets/views/profile.htm',
				controller: 'personController',
			})
			.when('/editmy', {
				templateUrl: 'assets/views/edit-profile.htm',
			})
			.when('/resetpassword', {
				templateUrl: 'assets/views/resetpassword.htm',
			})
			.when('/settings', {
				templateUrl: 'assets/views/settings.htm',
				controller: 'settingsController',
			})
			.when('/questions/:id?', {
				templateUrl: 'assets/views/questions.htm',
				controller: 'questionsController',
			})
			.when('/tagsearch/:query', {
				templateUrl: 'assets/views/search.htm',
				controller: 'searchController',
			})
			.when('/chat', {
				templateUrl: 'assets/views/chat.htm',
				controller: 'chatController',
			})


		$authProvider.facebook({
			clientId: 685381251615066
		})

		$authProvider.linkedin({
			clientId: '77cidth7sa053d',
			redirectUri: 'http://expertreaction.wlab.tech/auth/linkedin'
		});
	}
])
.run(['$rootScope', '$route', '$http', '$templateCache', '$location', '$cookies', 'identityService',
function ($rootScope, $route, $http, $templateCache, $location, $cookies, identityService) {
	// $templateCache.removeAll()

	$cookies.put('token', 'guest')

	var url;
	for (var i in $route.routes) {
		if (url = $route.routes[i].templateUrl) {
			$http.get(url, {cache: $templateCache});
		}
	}

	$rootScope.$on('$locationChangeStart', function (event, next, current) {
		var nextURI = next.split('#!')[1]

		var requireAuth = ['/my', '/settings']

		identityService.get().then(function (user) {
			if (!user) return

			if (!user.phone || !user.email) {
				return $location.url('/settings')
			}

			$rootScope.user = user

			if (requireAuth.indexOf(nextURI) > -1 && (!user/* || user.role == 'User'*/)) {
				console.log('Prevented to go to', nextURI)
				event.preventDefault()
				$location.url('/start')
			}
		}, function (error) {
			if (requireAuth.indexOf(nextURI) > -1) {
				console.log('Prevented to go to', nextURI)
				event.preventDefault()
				$location.url('/start')
			}
		})
	})
}])