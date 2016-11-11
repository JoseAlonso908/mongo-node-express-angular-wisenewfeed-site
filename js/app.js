var angular = require('angular')
require('angular-moment')
require('angular-modal')

window.numeral = require('numeral')
window.async = require('async')

// angular.module('er', ['ngRoute', 'ngSanitize', 'angularMoment', 'ngCookies', 'er.controllers', 'er.services', 'er.directives', 'satellizer'])
// .config(['$locationProvider', '$routeProvider', '$authProvider',
angular.module('er', [
	require('angular-route'), require('angular-animate'), require('angular-sanitize'), require('angular-cookies'), 'angularMoment', require('satellizer'),
	'btford.modal',
	'er.controllers', 'er.services', 'er.directives', 'er.modals', 'er.filters'])
.config(['$locationProvider', '$routeProvider', '$authProvider',
	function config($locationProvider, $routeProvider, $authProvider) {
		$locationProvider.hashPrefix('!')
		$routeProvider
			.when('/start', {
				templateUrl: 'assets/views/landing.htm'
			})
			.when('/confirmsignup', {
				templateUrl: 'assets/views/confirm-signup.htm'
			})
			.when('/', {
				templateUrl: 'assets/views/home.htm'
			})
			.when('/my', {
				templateUrl: 'assets/views/person.htm',
				controller: 'profileController'
			})
			.when('/person/:id', {
				templateUrl: 'assets/views/person.htm',
				controller: 'personController',
			})
			.when('/editmy', {
				templateUrl: 'assets/views/edit-profile.htm'
			})
			.when('/resetpassword', {
				templateUrl: 'assets/views/resetpassword.htm'
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
.run(function ($rootScope, $templateCache, $location, $cookies, identityService) {
	$templateCache.removeAll()

	$rootScope.$on('$locationChangeStart', function (event, next, current) {
		var nextURI = next.split('#!')[1]

		var requireAuth = ['/my']

		identityService.get().then(function (user) {
			if (requireAuth.indexOf(nextURI) > -1 && (!user || user.role == 'User')) {
				console.log('Prevented to go to', nextURI)
				event.preventDefault()
				$location.url('/start')
			}
		}, function () {
			if (requireAuth.indexOf(nextURI) > -1) {
				console.log('Prevented to go to', nextURI)
				event.preventDefault()
				$location.url('/start')
			}
		})
	})
})