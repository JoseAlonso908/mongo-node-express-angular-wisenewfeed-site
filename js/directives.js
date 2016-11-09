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
			user: '='
		},
		link: function ($scope, element, attr) {
			$scope.number = $scope.user.rating || 1
			$scope.color = $scope.user.color || 'bronze'
			$scope.image = $scope.user.avatar || '/assets/images/avatar_placeholder.png'
			$scope.role = $scope.user.role || 'User'
		}
	}
})
.directive('onyourmind', function ($rootScope, $timeout, postService) {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/onyourmind.htm',
		link: function ($scope, element, attr) {
			$scope.files = []

			$scope.user = $scope.$parent.user
			$scope.create = function () {
				if ($scope.loading) return
				$scope.loading = true

				var fileObjects = $scope.files.map(function (file) {
					return file.fileObject
				})

				var progress = function () {
					
				}

				postService.create($scope.text, fileObjects, progress).then(function (result) {
					$scope.$parent.$apply(function () {
						$scope.text = ''
						$scope.files = []
						$scope.$parent.$emit('reloadfeed')

						$scope.loading = false
					})
				}).catch(function (error) {
					console.error(error)
					$scope.loading = false
				})
			}

			$scope.addImage = function () {
				if ($scope.loading) return

				var fileFileInput = element[0].querySelector('input[type=file]')
				angular.element(fileFileInput).on('change', function (e) {
					e.stopImmediatePropagation()

					var reader = new FileReader()
					var file = e.target.files[0]

					reader.addEventListener('load', function () {
						$scope.$apply(function () {
							$scope.files.push({
								base64: reader.result,
								fileObject: file
							})

							// Reset form to clean file input. This will
							// let us upload the same file
							angular.element(e.target).parent()[0].reset()
						})
					})

					reader.readAsDataURL(file)
				})

				$timeout(function () {
					fileFileInput.click()
				}, 0)
			}

			$scope.removeUpload = function (index) {
				if ($scope.loading) return

				$scope.files = $scope.files.filter(function (file, fileIndex) {
					if (index == fileIndex) return false
					return true
				})
			}

			angular.element(element[0].querySelector('textarea')).on('keyup keypress', function (e) {
				var text = e.target.value,
					linesCount = text.split(/\n/).length

				var paddingTop = parseInt(window.getComputedStyle(e.target).paddingTop),
					paddingBottom = parseInt(window.getComputedStyle(e.target).paddingBottom)

				if (linesCount > 3) {
					angular.element(e.target).css('height', (((linesCount + 1) * 16) + (paddingTop + paddingBottom + 2)) + 'px')
				} else {
					angular.element(e.target).css('height', '')
				}
			})
		}
	}
})
.directive('feed', function (feedService, commentService) {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/feed.htm',
		link: function ($scope, element, attr) {
			$scope.user = $scope.$parent.user

			$scope.$parent.$on('reloadfeed', function () {
				init()
			})

			var init = function () {
				$scope.feedLoading = true
				$scope.feed = []
				feedService.get().then(function (feed) {
					$scope.feedLoading = false
					$scope.feed = feed
				})
			}

			init()
		}
	}
})
.directive('post', function (commentService) {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/post.htm',
		scope: {
			post: '='
		},
		link: function ($scope, element, attr) {
			$scope.user = $scope.$parent.user

			$scope.addComment = function (post) {
				commentService.add(post._id, post.commentText).then(function () {
					post.commentText = ''
					$scope.$emit('reloadcomments', post._id)
				})
			}
		}
	}
})
.directive('postcomments', function (postService) {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/postcomments.htm',
		scope: {
			post: '='
		},
		link: function ($scope, element, attr) {
			$scope.comments = []

			$scope.$parent.$on('reloadcomments', function (e, args) {
				console.log(args)
				init()
			})

			var init = function () {
				postService.getComments($scope.post._id).then(function (comments) {
					$scope.comments = comments
					$scope.$parent.commentsCount = $scope.comments.length
				})
			}

			init()
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
.directive('newquestions', function () {
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
.directive('familiarexperts', function (familiarExpertsService) {
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