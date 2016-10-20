angular.module('er.directives', [])
.directive('avatar', function () {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/avatar.htm',
		scope: {
			image: '@',
			color: '@',
			number: '@'
		},
	}
})
.directive('post', function () {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/post.htm',
		scope: {
			post: '='
		},
		link: function ($scope, element, attr) {
			$scope.user = $scope.$parent.user
		}
	}
})
.directive('question', function () {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/question.htm',
		scope: {
			question: '='
		},
	}
})
.directive('familiarexpert', function () {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/familiar-expert.htm',
		scope: {
			user: '='
		},
	}
})
.directive('newquestions', function ($timeout) {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/new-questions.htm',
		scope: {
			user: '='
		},
		link: function ($scope, element, attr) {
			$scope.questions = $scope.user.questions
		}
	}
})
.directive('familiarexperts', function ($timeout, familiarExpertsService) {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/familiar-experts.htm',
		link: function ($scope, element, attr) {
			$scope.users = []
			$scope.familiarExpertsLoading = true
			familiarExpertsService.then(function (users) {
				$scope.users = users
				$scope.familiarExpertsLoading = false
				$scope.$apply()
			})
		}
	}
})
.directive('topbar', function () {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/topbar.htm',
		scope: {user: '='},
	}
})
.directive('filters', function (dropdowns) {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/filters.htm',
		link: function ($scope, element, attr) {
			dropdowns()
		}
	}
})
.directive('bigratedavatar', function () {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/big-rated-avatar.htm',
		scope: {user: '='},
		link: function ($scope, element, attr) {
			var canvas = angular.element(element).find('canvas')[0],
				ctx = canvas.getContext('2d')

			var width = angular.element(element)[0].children[0].offsetWidth,
				height = angular.element(element)[0].children[0].offsetHeight

			angular.element(element).find('canvas').attr('width', width)
			angular.element(element).find('canvas').attr('height', height)

			var borderWidth = 4

			// Get user XP in radians
			var radsXP = ($scope.user.xp / 100 * 2) + 1.5

			ctx.lineWidth = borderWidth
			ctx.strokeStyle = '#43abe7'
			ctx.beginPath()
			ctx.arc(width / 2, height / 2, (width / 2) - (borderWidth / 2), 1.5 * Math.PI, radsXP * Math.PI, false)
			ctx.stroke()
		}
	}
})
.directive('autosuggest', function () {
	return {
		restrict: 'A',
		templateUrl: 'assets/views/directives/autosuggest.htm',
		scope: {
			suggestions: '=',
		},
		
	}
})