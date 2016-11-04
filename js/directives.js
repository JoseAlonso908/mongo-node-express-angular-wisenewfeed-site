angular.module('er.directives', [])
.directive('dropdown', function () {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/dropdown.htm',
		scope: {
			title: '@',
			defaultItem: '=',
			list: '=',
			chosen: '=',
			change: '=',
		},
		link: function ($scope, element, attr) {
			var rootElement = angular.element(element)[0]

			var dropdownButton = angular.element(rootElement.querySelector('.dropdown')),
				dropdownList = angular.element(rootElement.querySelector('.dropdown-list'))
				dropdownLists = angular.element(document.querySelectorAll('.dropdown-list'))

			angular.element(document.body).on('click', function (e) {
				dropdownList.removeClass('active')
			})

			dropdownList.on('click', function (e) {e.stopImmediatePropagation()})

			dropdownButton.on('click', function (e) {
				dropdownLists.removeClass('active')

				e.stopImmediatePropagation()
				dropdownList.toggleClass('active')
				angular.element(document.body).triggerHandler('shadow-click')
			})

			$scope.isActiveParentItem = function (parentItem) {
				for (var i in parentItem.sub) {
					if (parentItem.sub[i].id === $scope.chosen.id) return true
				}
			}

			$scope.isActiveItem = function (item) {
				return $scope.chosen.id == item.id
			}

			$scope.choose = function (item) {
				$scope.change(item)
				dropdownList.removeClass('active')
			}
		}
	}
})
.directive('usermenu', function ($auth, $rootScope, $cookies, $location) {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/usermenu.htm',
		scope: {user: '='},
		link: function ($scope, element, attr) {
			$scope.logout = function () {
				$cookies.remove('user')
				$auth.logout()
				$location.url('/start')
			}

			$scope.$on('open-user-menu', function (e, data) {
				$scope.active = true
			})

			angular.element(document.body).on('click shadow-click', function () {
				$scope.active = false
				$scope.$apply()
			})
		}
	}
})
.directive('avatar', function () {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/avatar.htm',
		scope: {
			image: '@',
			color: '@',
			number: '@',
			role: '@',
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
.directive('topbar', function ($rootScope) {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/topbar.htm',
		scope: {user: '='},
		link: function ($scope, element, attr) {
			$scope.openUserMenu = function (e) {
				e.stopPropagation()
				$rootScope.$broadcast('open-user-menu')
			}
		}
	}
})
.directive('filters', function () {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/filters.htm',
	}
})
.directive('bigratedavatar', function ($timeout) {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/big-rated-avatar.htm',
		scope: {
			user: '=',
			onEdit: '='
		},
		link: function ($scope, element, attr) {
			if (typeof $scope.onEdit === 'function') {
				$scope.editing = true
				$scope.chooseFile = function (e) {
					var fileInput = element[0].querySelector('input[type=file]')
					angular.element(fileInput).on('change', function (e) {
						e.stopImmediatePropagation()

						$scope.$apply(function () {
							var file = e.target.files[0]
							$scope.onEdit(file)
						})
					})

					$timeout(function () {
						fileInput.click()
					}, 0)
				}
			}


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
		restrict: 'E',
		templateUrl: 'assets/views/directives/autosuggest.htm',
		scope: {
			suggestions: '=',
			ngModel: '=',
		},
		link: function ($scope, element, attr) {
			$scope.show = false

			var lastUserValue
			
			$scope.$watch('ngModel', function (newValue, oldValue) {
				if (newValue && newValue != oldValue && oldValue != lastUserValue) {
					$scope.filteredSuggestions = []

					for (var i = 0; i < $scope.suggestions.length; i++) {
						var item = $scope.suggestions[i]
						if (item.toLowerCase().indexOf(newValue.toLowerCase()) !== -1) {
							$scope.filteredSuggestions.push(item)
						}
					}

					$scope.filteredSuggestions = $scope.filteredSuggestions.slice(0, 7)

					$scope.show = true
				} else {
					$scope.show = false
				}
			})

			$scope.setSuggestion = function (value) {
				lastUserValue = $scope.ngModel
				$scope.ngModel = value
				$scope.show = false
			}
		}
	}
})