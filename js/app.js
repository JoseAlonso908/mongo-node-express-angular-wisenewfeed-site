var angular = require('angular')
require('angular-moment')
require('angular-modal')
require('angular-chosen-localytics')
window.rangy = require('rangy')
require('rangy/lib/rangy-selectionsaverestore.js')

window.numeral = require('numeral')
window.async = require('async')

angular.module('er', [
	require('angular-route'), require('angular-animate'), require('angular-sanitize'), require('angular-cookies'),
	'angularMoment', require('satellizer'), require('angular-socialshare'),require('angular-material'),
    require('angular-messages'),
	// 'ngScrollbar',
	'localytics.directives', 'btford.modal','ngMask',
	'er.controllers', 'er.services', 'er.directives', 'er.modals', 'er.filters'])
.config(['$locationProvider', '$routeProvider', '$authProvider', '$compileProvider', '$httpProvider',
	function config($locationProvider, $routeProvider, $authProvider, $compileProvider, $httpProvider) {
        $httpProvider.useApplyAsync(true)

		$compileProvider.debugInfoEnabled(true)
		$compileProvider.aHrefSanitizationWhitelist(/^\s*(http|https|javascript):/)

		$locationProvider.hashPrefix('!')
		$routeProvider
            .when('/beta/:role?', {
                templateUrl: 'assets/views/beta.htm',
                controller: 'betaController'
            })
			.when('/start', {
				templateUrl: 'assets/views/landing.htm',
			})
			.when('/confirmsignup', {
				templateUrl: 'assets/views/confirm-signup.htm',
			})
			.when('/', {
				templateUrl: 'assets/views/home.htm',
				controller: 'homeController',
			})
            .when('/friendsfeed', {
                templateUrl: 'assets/views/friendsfeed.htm',
                controller: 'friendsFeedController'
            })
			.when('/my', {
				templateUrl: 'assets/views/profile.htm',
				controller: 'profileController',
			})
			.when('/profilefeed/:id/:type', {
				templateUrl: 'assets/views/profile.htm',
				controller: 'profileFeedController',
			})
            .when('/friends', {
                templateUrl: 'assets/views/friends.htm',
                controller: 'friendsController',
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
			.when('/questions/:id?/:qid?', {
				templateUrl: 'assets/views/questions.htm',
				controller: 'questionsController',
			})
			.when('/tagsearch/:query', {
				templateUrl: 'assets/views/search.htm',
				controller: 'searchController',
			})
			.when('/chat/:user?', {
				templateUrl: 'assets/views/chat.htm',
				controller: 'chatController',
			})
			.when('/users/:role?', {
				templateUrl: 'assets/views/userslist.htm',
				controller: 'usersListController',
			})
			.when('/photos/:id?', {
				templateUrl: 'assets/views/profilephotos.htm',
				controller: 'profilePhotosController',
			})
			.when('/write', {
				templateUrl: 'assets/views/write.htm',
				controller: 'writeController',
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
function ($rootScope, $route, $http, $templateCache, $location, $cookies, identityService, messagesService) {
	// $templateCache.removeAll()

	$cookies.put('token', 'guest')

	var url;
	for (var i in $route.routes) {
		if (url = $route.routes[i].templateUrl) {
			$http.get(url, {cache: $templateCache});
		}
	}

	identityService.get().then(function (user) {
		if (!user) return
	})

	$rootScope.$on('$locationChangeStart', function (event, next, current) {
		var nextURI = next.split('#!')[1]

		var requireAuth = ['/my', '/settings', '/chat']

		identityService.get().then(function (user) {
			if (!user) return

			if (!window.socket || !window.socket.connected) {
				window.socket = io.connect(location.origin, {query: 'uid=' + user._id})
				window.socket.on('connect', function () {
					console.log('ws-ready')
					$rootScope.$emit('ws-ready')
				})
			}

			if (!user.phone || !user.email) {
				return $location.url('/settings')
			}

			var notForUser = ['/my']

			if (user.role == 'User' && notForUser.indexOf(nextURI) > -1) {
				return $location.url('/')
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
