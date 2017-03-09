angular.module('er.directives', [])
.directive('contenteditable', function() {
	return {
		restrict: 'A',
		require: 'ngModel',
		scope: {
			'htmlValue': '=',
		},
		link: function(scope, element, attrs, ngModel) {
			function read() {
				var selection = rangy.saveSelection()
                var text = element.html()
                // remove all tags markers (we'll put them back later)
				text = text.replace(/<tag>([\s\S]*?)<\/tag>/gmi, "$1")
                text = text.replace(/(>|^|\s|&nbsp;)((#|@|\$|!)[a-z]+[a-z0-9]+)/gmi, function (match, space, tag, offset, string) {
					return space + '<tag>' + tag + '</tag>'
				})

                element.html(text)
				rangy.restoreSelection(selection)
				rangy.removeMarkers(selection)

                text = element.html()

				// turn <br> into newline character
				text = text.replace(/<br\s?\/?>/gi, "\n")

				// FIXME: I'll go to hell because of this shit
                scope.$parent.textHtml = text

				// fix divs
				text = text.replace(/<div.*?>([\s\S]*?)<\/div>/gmi, "\n$1")
				// remove all other tags
				text = text.replace(/(<[a-zA-Z0-9-]+.*?>([\s\S]*?)<\/[a-zA-Z0-9-]+>|<[a-zA-Z0-9-]+.*\/>)/gmi, "$2")

				ngModel.$setViewValue(text)
			}

			ngModel.$render = function() {
				element.html(ngModel.$viewValue || "")
			}

			element.bind("input", read)
		}
	}
})
.directive('ngScrollbar', ['$parse', '$window', '$rootScope',
	function ($parse, $window, $rootScope) {
		return {
			restrict: 'A',
			replace: true,
			transclude: true,
			scope: {
				'showYScrollbar': '=?isBarShown',
				'scrollbarHide': '=',
			},
			link: function (scope, element, attrs) {
                if (scope.scrollbarHide == true) {
                    return false
                }

				// That's bad!
				// -- And few crutches from my side
                if ((/ipad/i).test(navigator.userAgent) && window.innerWidth > 400) $(element).addClass('overflow')
				if (window.innerWidth < 600 || (/ipad|iphone/i).test(navigator.userAgent)) return
				var mainElm, transculdedContainer, tools, thumb, thumbLine, track;
				var flags = { bottom: attrs.hasOwnProperty('bottom') };
				var win = angular.element($window);
				var hasAddEventListener = !!win[0].addEventListener;
				var hasRemoveEventListener = !!win[0].removeEventListener;
				// Elements
				var dragger = { top: 0 }, page = { top: 0 };
				// Styles
				var scrollboxStyle, draggerStyle, draggerLineStyle, pageStyle;
				var calcStyles = function () {
					scrollboxStyle = {
						position: 'relative',
						overflow: 'hidden',
						'max-width': '100%',
						height: '100%'
					};
					if (page.height) {
						scrollboxStyle.height = page.height + 'px';
					}
					draggerStyle = {
						position: 'absolute',
						height: dragger.height + 'px',
						top: dragger.top + 'px'
					};
					draggerLineStyle = {
						position: 'relative',
						'line-height': dragger.height + 'px'
					};
					pageStyle = {
						position: 'relative',
						top: page.top + 'px',
						overflow: 'hidden'
					};
				};
				var redraw = function () {
					thumb.css('top', dragger.top + 'px');
					var draggerOffset = dragger.top / page.height;
					page.top = -Math.round(page.scrollHeight * draggerOffset);
					transculdedContainer.css('top', page.top + 'px');
					$rootScope.$broadcast('scrollbar-redraw', element, page.top)
				};
				var trackClick = function (event) {
					var offsetY = event.hasOwnProperty('offsetY') ? event.offsetY : event.layerY;
					var newTop = Math.max(0, Math.min(parseInt(dragger.trackHeight, 10) - parseInt(dragger.height, 10), offsetY));
					dragger.top = newTop;
					redraw();
					event.stopPropagation();
				};
				var wheelHandler = function (event) {
					var wheelSpeed = 60;
					// Mousewheel speed normalization approach adopted from
					// http://stackoverflow.com/a/13650579/1427418
					var o = event, d = o.detail, w = o.wheelDelta, n = 225, n1 = n - 1;
					// Normalize delta
					d = d ? w && (f = w / d) ? d / f : -d / 1.35 : w / 120;
					// Quadratic scale if |d| > 1
					d = d < 1 ? d < -1 ? (-Math.pow(d, 2) - n1) / n : d : (Math.pow(d, 2) + n1) / n;
					// Delta *should* not be greater than 2...
					event.delta = Math.min(Math.max(d / 2, -1), 1);
					event.delta = event.delta * wheelSpeed;
					dragger.top = Math.max(0, Math.min(parseInt(page.height, 10) - parseInt(dragger.height, 10), parseInt(dragger.top, 10) - (event.delta / page.height * dragger.height)));
					redraw();
					if (!!event.preventDefault) {
						event.preventDefault();
					} else {
						return false;
					}
				};
				var lastOffsetY = 0;
				var thumbDrag = function (event, offsetX, offsetY) {
					dragger.top = Math.max(0, Math.min(parseInt(dragger.trackHeight, 10) - parseInt(dragger.height, 10), offsetY));
					event.stopPropagation();
				};
				var dragHandler = function (event) {
					var newOffsetX = 0;
					var newOffsetY = event.pageY - thumb[0].scrollTop - lastOffsetY;
					thumbDrag(event, newOffsetX, newOffsetY);
					redraw();
				};
				var _mouseUp = function (event) {
					win.off('mousemove', dragHandler);
					win.off('mouseup', _mouseUp);
					event.stopPropagation();
				};
				var _touchDragHandler = function (event) {
					var newOffsetX = 0;
					var newOffsetY = event.originalEvent.changedTouches[0].pageY - thumb[0].scrollTop - lastOffsetY;
					thumbDrag(event, newOffsetX, newOffsetY);
					redraw();
				};
				var _touchEnd = function (event) {
					win.off('touchmove', _touchDragHandler);
					win.off('touchend', _touchEnd);
					event.stopPropagation();
				};
				var registerEvent = function (elm) {
					var wheelEvent = win[0].onmousewheel !== undefined ? 'mousewheel' : 'DOMMouseScroll';
					if (hasAddEventListener) {
						elm.addEventListener(wheelEvent, wheelHandler, false);
					} else {
						elm.attachEvent('onmousewheel', wheelHandler);
					}
				};
				var removeEvent = function (elm) {
					var wheelEvent = win[0].onmousewheel !== undefined ? 'mousewheel' : 'DOMMouseScroll';
					if (hasRemoveEventListener) {
						elm.removeEventListener(wheelEvent, wheelHandler, false);
					} else {
						elm.detachEvent('onmousewheel', wheelHandler);
					}
				};
				var buildScrollbar = function (rollToBottom) {
					rollToBottom = flags.bottom || rollToBottom;
					mainElm = angular.element(element.children()[0]);
					transculdedContainer = angular.element(mainElm.children()[0]);
					tools = angular.element(mainElm.children()[1]);
					thumb = angular.element(angular.element(tools.children()[0]).children()[0]);
					thumbLine = angular.element(thumb.children()[0]);
					track = angular.element(angular.element(tools.children()[0]).children()[1]);
					page.height = element[0].offsetHeight;
					page.scrollHeight = transculdedContainer[0].scrollHeight;

					if (page.height < page.scrollHeight) {
						scope.showYScrollbar = true;
						scope.$emit('scrollbar.show');
						// Calculate the dragger height
						dragger.height = Math.round(page.height / page.scrollHeight * page.height);
						dragger.trackHeight = page.height;
						// update the transcluded content style and clear the parent's
						calcStyles();
						element.css({ overflow: 'hidden' });
						mainElm.css(scrollboxStyle);
						transculdedContainer.css(pageStyle);
						thumb.css(draggerStyle);
						thumbLine.css(draggerLineStyle);
						// Bind scroll bar events
						track.bind('click', trackClick);
						// Handle mousewheel
						registerEvent(transculdedContainer[0]);
						// Drag the scroller with the mouse
						thumb.on('mousedown', function (event) {
							lastOffsetY = event.pageY - thumb[0].offsetTop;
							win.on('mouseup', _mouseUp);
							win.on('mousemove', dragHandler);
							event.preventDefault();
						});
						// Drag the scroller by touch
						thumb.on('touchstart', function (event) {
							lastOffsetY = event.originalEvent.changedTouches[0].pageY - thumb[0].offsetTop;
							win.on('touchend', _touchEnd);
							win.on('touchmove', _touchDragHandler);
							event.preventDefault();
						});
						if (rollToBottom) {
							flags.bottom = false;
							dragger.top = parseInt(page.height, 10) - parseInt(dragger.height, 10);
						} else {
							dragger.top = Math.max(0, Math.min(parseInt(page.height, 10) - parseInt(dragger.height, 10), parseInt(dragger.top, 10)));
						}
						redraw();
					} else {
						scope.showYScrollbar = false;
						scope.$emit('scrollbar.hide');
						thumb.off('mousedown');
						removeEvent(transculdedContainer[0]);
						transculdedContainer.attr('style', 'position:relative;top:0');
						// little hack to remove other inline styles
						mainElm.css({ height: '100%' });
					}
				};
				var rebuildTimer;
				var rebuild = function (e, data) {
					/* jshint -W116 */
					if (rebuildTimer != null) {
						clearTimeout(rebuildTimer);
					}
					/* jshint +W116 */
					var rollToBottom = !!data && !!data.rollToBottom;
					rebuildTimer = setTimeout(function () {
						page.height = null;
						buildScrollbar(rollToBottom);
						if (!scope.$$phase) {
							scope.$digest();
						}
						// update parent for flag update
						if (!scope.$parent.$$phase) {
							scope.$parent.$digest();
						}
					}, 72);
				};
				buildScrollbar();
				if (!!attrs.rebuildOn) {
					attrs.rebuildOn.split(' ').forEach(function (eventName) {
						scope.$on(eventName, rebuild);
					});

					if (!!attrs.rebuildBottomOn) {
                        attrs.rebuildBottomOn.split(' ').forEach(function (eventName) {
                            scope.$on(eventName, function (e) {
                                rebuild(e, {rollToBottom: true})
                            })
                        });
                    }
				}
				if (attrs.hasOwnProperty('rebuildOnResize')) {
					win.on('resize', rebuild);
				}
			},
			template: '<div><div class="ngsb-wrap"><div class="ngsb-container" ng-transclude></div><div class="ngsb-scrollbar" style="position: absolute; display: block;" ng-show="showYScrollbar"><div class="ngsb-thumb-container"><div class="ngsb-thumb-pos" oncontextmenu="return false;"><div class="ngsb-thumb" ></div></div><div class="ngsb-track"></div></div></div></div></div>'
		};
	}
])
.directive('dropdown', function ($timeout) {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/dropdown.htm',
		scope: {
			title: '@',
			defaultItem: '=',
			list: '=',
			selected: '=',
			change: '=',
			overflow: '@',
			scrollOnSecond: '@'
		},
		link: function ($scope, element, attr) {
			var rootElement = angular.element(element)[0]

			if ($scope.scrollOnSecond == 'true') $scope.scrollOnSecond = true
            else $scope.scrollOnSecond = false

            var dropdownButton = angular.element(rootElement.querySelector('.dropdown')),
				dropdownList = angular.element(rootElement.querySelector('.dropdown-list')),
				dropdownLists = angular.element(document.querySelectorAll('.dropdown-list'))

            angular.element(document.body).on('click', function (e) {
				dropdownList.removeClass('active')
			})

			dropdownList.on('click', function (e) {e.stopImmediatePropagation()})
			dropdownList.on('mouseleave', function (e) {
				dropdownLists.removeClass('active')
			})

			dropdownButton.on('click', function (e) {
                $scope.$broadcast('rebuild-me')
                e.stopImmediatePropagation()
				$timeout(function () {
					document.body.click()

					// dropdownLists.removeClass('active')
					dropdownList.toggleClass('active')
				}, 10)
			})
			$scope.isActiveParentItem = function (parentItem) {
				for (var i in parentItem.sub) {
					if (parentItem.sub[i].id === $scope.selected.id) return true
				}
			}

			$scope.isActiveItem = function (item) {
				return $scope.selected.id == item.id
			}

			$scope.choose = function (item) {
				$scope.change(item)
				dropdownList.removeClass('active')
			}
		}
	}
})
.directive('usermenu', function ($auth, $rootScope, $cookies, $location, $timeout, identityService) {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/usermenu.htm',
		scope: {user: '='},
		link: function ($scope, element, attr) {
			$scope.logout = function () {
				$cookies.remove('user')
				$cookies.remove('token')
				$auth.logout()
				identityService.clean()
				$location.url('/start')
				window.location.reload()
			}

			$scope.$on('open-user-menu', function (e, data) {
				$timeout(function () {
					document.body.click()
					$scope.active = true
				}, 10)
			})

			angular.element(document.body).on('click shadow-click', function () {
				$scope.active = false
				$scope.$apply()
			})
		}
	}
})
.directive('avatar', function ($rootScope) {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/avatar.htm',
		scope: {
			user: '=',
			nolink: '=',
		},
		link: function ($scope, element, attr) {
			$scope.nl = $scope.nolink || false

			$scope.user.role = $scope.user.role[0].toUpperCase() + $scope.user.role.substr(1)

			if (!$scope.user) {
				return angular.element(element).css('backgroundColor', 'red')
			}

			$scope.number = ($scope.user.xpInfo && $scope.user.xpInfo.level) ? $scope.user.xpInfo.level : 1
			$scope.color = $scope.user.color || 'bronze'
			$scope.image = $scope.user.avatar || '/assets/images/avatar_placeholder.png'
			$scope.role = $scope.user.role || 'User'

			if ($scope.role == 'User') {
				$scope.nl = true
			}
		}
	}
})
.directive('onyourmind', function ($rootScope, $timeout, postService, $compile, piecesService) {
	return {
		restrict: 'E',
		scope: {
			user: '='
		},
		templateUrl: 'assets/views/directives/onyourmind.htm',
		link: function ($scope, element, attr) {
			$scope.create = function () {
                console.log('$scope.privacy', $scope.privacy);
                if ($scope.loading) return
				$scope.loading = true

				var fileObjects = $scope.files.map(function (file) {
					return file.fileObject
				})

				var progress = function () {}
				postService.create({
                        title: '',
                        text: $scope.text,
                        files: fileObjects,
                        privacy: $scope.privacy
                    }, progress
                ).then(function (result) {
					$scope.$parent.$apply(function () {
						$scope.text = ''
						$scope.files = []
						$rootScope.$emit('reloadfeed')
						$rootScope.$emit('updateCategoriesFilter')

						$scope.loading = false
					})
				}).catch(function (error) {
					console.error(error)
					$scope.loading = false
				})
			}

            $scope.files = []
			/* TODO: change to constants */

			if ($scope.user.role == 'User') {
                $scope.privacy = 'Friend'
            } else {
                $scope.privacy = 'Stranger'
			}
			$scope.addImage = function () {
				if ($scope.loading) return

				var fileFileInput = element[0].querySelector('input[type=file]')
				angular.element(fileFileInput).on('change', function (e) {
					e.stopImmediatePropagation()

					var reader = new FileReader()
					var file = e.target.files[0]

                    if (file.size > 5 * 1024 * 1024) {
                        return alert('Image size should be less than 5 MB')
                    }

					if (['image/jpeg', 'image/png'].indexOf(file.type) === -1) {
						return
					}

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
					$timeout.cancel(this)
				}, 0)
			}

			$scope.removeUpload = function (index) {
				if ($scope.loading) return

				$scope.files = $scope.files.filter(function (file, fileIndex) {
					if (index == fileIndex) return false
					return true
				})
			}

            var ce = element[0].querySelector('[contenteditable]')

			$scope.acDo = function (item) {
				$scope.acFocusedNode.textContent = item

				var selection = rangy.getSelection()
				selection.removeAllRanges()

				var range = rangy.createRange()
				range.selectNode($scope.acFocusedNode)
				range.collapse()

				selection.setSingleRange(range)

				console.log('refocused 3')
				$(ce).trigger('input')
				$scope.acFocusedNode = null
				$scope.acVisible = false
				$scope.acList = []
			}

			angular.element(ce).on('keydown', function (e) {
                if (!$scope.acVisible || !$scope.acList || $scope.acList.length == 0) return

                if ([9, 13, 38, 40].indexOf(e.keyCode) !== -1) {
					switch (e.keyCode) {
						case 9:
						case 13:
                        	angular.element(document.querySelector('.aclist')).find('.item.active').triggerHandler('click');
							break
						case 38:
							if ($scope.acActive > 0) {
								$scope.acActive--
							} else {
								$scope.acActive = $scope.acList.length - 1
							}
							break
						case 40:
                            if ($scope.acActive < $scope.acList.length - 1) {
                                $scope.acActive++
                            } else {
                                $scope.acActive = 0
                            }
							break
					}

					e.preventDefault()
				}
			})

			$scope.autocomplete = function (e) {
                if ([9, 13, 38, 40].indexOf(e.keyCode) !== -1) return

				var savedSelection = rangy.saveSelection(ce)
				var bookmark = angular.element(document.querySelector('#' + savedSelection.rangeInfos[0].markerId))
				bookmark.css('display', '')
				var pxOffset = bookmark.offset()
                rangy.removeMarkers(savedSelection)

				var selection = rangy.getSelection(ce)

				var focus = {
					node: selection.nativeSelection.focusNode,
					offset: selection.nativeSelection.focusOffset - 1,
				}

				if (focus.node.parentElement.tagName !== 'TAG' || !selection.isCollapsed) {
                    $scope.acVisible = false
					return
				}

				$scope.acVisible = true

                piecesService.search(focus.node.textContent).then(function (result) {
                	$scope.acList = result
					$scope.acActive = 0
				})


				$scope.acPosition = pxOffset
				$scope.acFocusedNode = focus.node

				if (!document.querySelector('.aclist')) {
                	console.log('No ac list')
                	var aclistElement = angular.element(
                		'<div class="aclist" ng-class="{visible: (acVisible && acList.length > 0)}" ng-style="{top: acPosition.top + \'px\', left: acPosition.left +\'px\'}">' +
							'<div class="item" ng-class="{active: acActive == $index}" ng-click="acDo(item)" ng-repeat="item in acList">' +
								'<div class="title">{{item}}</div>' +
								'<div class="checked"><i class="material-icons">check</i></div>' +
							'</div>' +
						'</div>'
					)
					aclistElement.appendTo(document.body)

					$compile(aclistElement)($scope)
				}
			}

			$scope.$watch(function () {
				return $scope.text
			}, function (newValue) {
				if (!newValue) return

				var text = newValue.trim(),
					linesCount = text.split(/\n/).length

				var paddingTop = parseInt(window.getComputedStyle(ce).paddingTop, 10),
					paddingBottom = parseInt(window.getComputedStyle(ce).paddingBottom, 10)

				if (linesCount > 3) {
					angular.element(ce).css('height', (((linesCount + 1) * 16) + (paddingTop + paddingBottom + 2)) + 'px')
				} else {
					angular.element(ce).css('height', '')
				}
			})
		}
	}
})
.directive('profilereactions', function ($rootScope) {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/profilereactions.htm',
		scope: {
			active: '=',
			profile: '='
		},
		link: function ($scope, element, attr) {

		},
	}
})
.directive('aboutbox', function () {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/aboutbox.htm',
	}
})
.directive('searchfeed', function ($rootScope, identityService, feedService) {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/feed.htm',
		scope: {
			type: '=',
			id: '=',
			user: '=',
			q: '=',
		},
		link: function ($scope, element, attr) {
			var start = 0,
				originalLimit = limit = 5

			angular.element(window).on('scroll', function (e) {
				if (window.scrollY + document.documentElement.clientHeight > document.documentElement.scrollHeight - 30 && !$scope.feedLoading) {
					init({addmore: true})
				}
			})

			$rootScope.$on('updateFeedVisibleCount', function (event) {
				updateVisibleCount($scope.feed)
			})

			$rootScope.$on('feedCategory', function (event, category) {
				if (category.id === 0) {
					$scope.lastCategory = undefined
				} else {
					$scope.lastCategory = category.tag
				}

				init()
			})

			$rootScope.$on('feedCountry', function (event, country) {
				if (country.id === 0) {
					$scope.lastCountry = undefined
				} else {
					$scope.lastCountry = country.title
				}

				init()
			})

			$rootScope.$on('feedFilter', function (event, filter) {
				$scope.filter = filter

				init()
			})

			var updateVisibleCount = function (feed) {
				var count = 0

				for (var i in feed) {
					var article = feed[i]

					if (/*!article.hidden && */!article.muted && !article.blocked) {
						count++
					}
				}

				$scope.visibleCount = count
			}

			var init = function (options) {
				if (!options) {
					options = {
						addmore: false,
					}
				}

				if (!$scope.user) {
					feedType = 'all'
				}

				$scope.feedLoading = true

				if (start == 0 || !options.addmore) {
					$scope.feed = []
					start = 0
				}

				var setFeed = function (feed) {
					$scope.feedLoading = false



					if (start > 0 || options.addmore) {
						for (var i in feed) {
							$scope.feed.push(feed[i])
						}
					} else {
						$scope.feed = feed
					}

					start += feed.length
				}

				feedService.search({
					q: $scope.q,
					start: start,
					limit: limit,
					filter: $scope.filter,
					category: $scope.lastCategory,
					country: $scope.lastCountry,
				}).then(function (feed) {
					setFeed(feed)
					updateVisibleCount($scope.feed)
				})
			}

			init()
		},
	}
})
.directive('feed', function ($rootScope, identityService, feedService) {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/feed.htm',
		scope: {
			type: '=',
			id: '=',
			user: '=',
		},
		link: function ($scope, element, attr) {
			var start = 0,
				originalLimit = limit = 5

			$scope.lastCategory
			$scope.lastCountry
			$scope.filter

			$scope.feedDone = false

			$rootScope.$on('reloadfeed', function () {
				init()
			})

			angular.element(window).on('scroll', function (e) {
				if (window.scrollY + document.documentElement.clientHeight > document.documentElement.scrollHeight - 30 && !$scope.feedLoading && !$scope.feedDone) {
					init({addmore: true})
				}
			})

			$rootScope.$on('feedCategory', function (event, category) {
				if (category.id === 0) {
					$scope.lastCategory = undefined
				} else {
					$scope.lastCategory = category.tag
				}

				init()
			})

			$rootScope.$on('feedCountry', function (event, country) {
				if (country.id === 0) {
					$scope.lastCountry = undefined
				} else {
					$scope.lastCountry = country.title
				}

				init()
			})

			$rootScope.$on('feedFilter', function (event, filter) {
				$scope.filter = filter

				init()
			})

			identityService.mutedAuthors().then(function (authors) {
				$scope.mutedAuthors = authors
			})

			var feedType = 'all'

			$rootScope.$on('updateFeedVisibleCount', function (event) {
				updateVisibleCount($scope.feed)
			})

			var updateVisibleCount = function (feed) {
				var count = 0

				for (var i in feed) {
					var article = feed[i]

					if (/*!article.hidden && */!article.muted && !article.blocked) {
						count++
					}
				}

				$scope.visibleCount = count
			}

			var init = function (options) {
				if (!options) {
					options = {
						addmore: false,
					}
				}

				if (!$scope.user) {
					feedType = 'all'
				}

				if (attr.hasOwnProperty('friendsfeed')) {
					feedType = 'friends'
				}

				$scope.feedLoading = true

				if (start == 0 || !options.addmore) {
					$scope.feed = []
					start = 0
				}

				var setFeed = function (feed) {
					$scope.feedLoading = false

					if (feed.length == 0) {
						$scope.feedDone = true
					}

					if (start > 0 || options.addmore) {
						for (var i in feed) {
							$scope.feed.push(feed[i])
						}
					} else {
						$scope.feed = feed
					}

					start += feed.length
				}

				if ($scope.type == 'own') {
					feedService.byUser($scope.id, start, limit).then(function (feed) {
						setFeed(feed)
						updateVisibleCount($scope.feed)
					})
				} else if ($scope.type && $scope.type != 'own') {
					feedService.reacted($scope.id, $scope.type, start, limit).then(function (feed) {
						setFeed(feed)
						updateVisibleCount($scope.feed)
					})
				} else {
					var feedAttributes = {category: $scope.lastCategory, country: $scope.lastCountry, filter: $scope.filter}
					if ($scope.user) feedAttributes['user'] = $scope.user._id
					feedAttributes['start'] = start
					feedAttributes['limit'] = limit

					feedService[feedType].call(feedService, feedAttributes).then(function (feed) {
						// $scope.feedLoading = false
						// $scope.feed = feed

						if (feed.length == 0 && feedType != 'all' && start == 0) {
							// feedType = 'all'
							// return init()
						}

						setFeed(feed)
						updateVisibleCount($scope.feed)
					})
				}
			}

			init()
		}
	}
})
.directive('post', function ($rootScope, $window, $timeout, identityService, postService, commentService, reactionsService, followService, reportModal) {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/post.htm',
		scope: {
			post: '=',
			user: '=',
			// When "justone" is true we don't need to collapse comments or enable link to separate post
			justone: '=',
		},
		link: function ($scope, element, attr) {
			$scope.expandVisible = false
			$scope.editing = false

			$timeout(function () {
				if ($scope.justone) return

				var $content = element.find('.content')[0]
				if ($content.scrollHeight - 10 > $content.clientHeight) {
					$scope.expandVisible = true
					$scope.$apply()
				}
			})

			angular.element(document.body).on('click', function () {
				$scope.post.menu = false
			})

			followService.isFollowing($scope.post.author._id).then(function (result) {
				$scope.post.author.isFollowing = result
			})

			$scope.getURL = function (id) {
				return $window.location.origin + '/permarticle/' + id
            }

            $scope.likesClass = function(reactions) {
				if (!reactions || !reactions.total) return ''
                var className = ''
				if (reactions.total.likes == 0 && reactions.total.dislikes == 0) className = 'not-active'
                if (reactions.likes_percentage >= 0 && reactions.likes_percentage <= 25) className += ' bad'
				else if (reactions.likes_percentage > 25 && reactions.likes_percentage <= 50) className += ' avg'
				else if (reactions.likes_percentage > 50) className += ' good'
                return className
            }

            $scope.likesDescription = function (percent) {
                var label = ''
                if (percent >= 0 && percent <= 25) label = 'Bad'
                else if (percent > 25 && percent <= 50) label = 'Average'
                else if (percent > 50) label = 'Good'
                return label
            }
            var decodeHtmlEntity = function(str) {
                return str.replace(/&#(\d+);/g, function(match, dec) {
                    return String.fromCharCode(dec);
                });
            };

			$scope.setEditingMode = function (post, mode) {
				mode = (typeof mode !== 'undefined') ? mode : true

				if (mode) {
					if (!post.text) post.text = ''
					post.editingText = decodeHtmlEntity(post.text)
                    post.editingText = post.editingText.replace(/<tag>([\s\S]*?)<\/tag>/gmi, "$1")
                    post.editingText = post.editingText.replace(/<br\s?\/?>/gi, "\n")

                    // fix divs
                    post.editingText = post.editingText.replace(/<div.*?>([\s\S]*?)<\/div>/gmi, "\n$1")
                    // remove all other tags
                    post.editingText = post.editingText.replace(/(<[a-zA-Z0-9-]+.*?>([\s\S]*?)<\/[a-zA-Z0-9-]+>|<[a-zA-Z0-9-]+.*\/>)/gmi, "$2")
					post.editingText = post.editingText.
						replace(/<br\s*\/?\s*>/gmi, "\r\n").
						replace(/&nbsp;/gmi, ' ').
						replace(/&amp;/gmi, '&')
				} else {
					post.editingText = null
				}

				$scope.editing = mode
			}
			/*TODO: DUPLICATED IN  postreactions directive */
            var initReactions = function () {
                reactionsService.get($scope.post._id).then(function (reactionInfo) {
                    $scope.post.youdid = reactionInfo.youdid
                    $scope.post.reactions = reactionInfo.reactions
                    var likes = reactionInfo.reactions.total.likes
                    var dislikes = reactionInfo.reactions.total.dislikes
                    var likes_percentage = parseInt((likes / (likes + dislikes)) * 100)
                    if (likes_percentage !== likes_percentage) likes_percentage = 0
                    $scope.post.reactions.likes_percentage = likes_percentage
                }, function (error) {
                    console.error(error)
                })
            }

            initReactions()

			/*TODO: DUPLICATED IN  postreactions directive */
            $rootScope.$on('reloadreactions', function (event, postId) {
                if (postId != $scope.post._id) return
                initReactions()
            })

			$scope.updatePost = function (post) {
				$scope.loading = true

				postService.update(post._id, post.editingText, []).then(function (result) {
					$scope.loading = false
					post.text = result.data.article.text
					$scope.setEditingMode(post, false)
					$scope.$apply()
				})
			}

			$scope.follow = function (post) {
				followService.follow(post.author._id).then(function (result) {
					$scope.post.author.isFollowing = result
				})
			}

			$scope.unfollow = function (post) {
				followService.unfollow(post.author._id).then(function (result) {
					$scope.post.author.isFollowing = result
				})
			}

			$scope.hide = function (post) {
				postService.hide(post._id).then(function (result) {
					$scope.post.hidden = true
					$rootScope.$emit('updateFeedVisibleCount')
				})
			}

			$scope.unhide = function (post) {
				postService.unhide(post._id).then(function (result) {
					$scope.post.hidden = false
					$rootScope.$emit('updateFeedVisibleCount')
				})
			}

			$rootScope.$on('muteauthor', function (event, authorId) {
				if ($scope.post.author._id == authorId) {
					$scope.post.muted = true
					$rootScope.$emit('updateFeedVisibleCount')
				}
			})

			$scope.mute = function (author) {
				postService.mute(author._id).then(function (result) {
					$rootScope.$emit('muteauthor', author._id)
				})
			}

			$scope.block = function (author) {
				identityService.block(author._id).then(function (result) {
					$scope.post.blocked = true
					$rootScope.$emit('updateFeedVisibleCount')
				})
			}

			$scope.report = function (post) {
				identityService.report(post._id).then(function (result) {
                    $scope.post.hidden = true
					reportModal.activate({$parent: $scope})
                    $rootScope.$emit('updateFeedVisibleCount')
                })
			}

			$scope.files = []

			$scope.addComment = function (post) {
				if ($scope.loading) return
				$scope.loading = true

				var fileObjects = $scope.files.map(function (file) {
					return file.fileObject
				})

				var progress = function () {

				}

				var commentObject = {
					_id: '',
					author: $scope.user,
					createdAt: (new Date()),
					dislikes: 0,
					likes: 0,
					post: post._id,
					text: post.commentText,
					hideShowMore: true,
					images: $scope.files.map(function (f) {
						return f.base64
					})
				}

				if (!post.comments) {
					post.comments = []
				}

				post.comments.push(commentObject)

				commentService.add(post._id, post.commentText, fileObjects).then(function () {
					$rootScope.$emit('reloadcomments', post._id)
					$scope.loading = false
				}, function () {
					$scope.loading = false
				})

				post.commentText = ''
				$scope.files = []
			}

			$scope.addImage = function () {
				if ($scope.loading) return

				var fileFileInput = element[0].querySelector('input[type=file]')
				angular.element(fileFileInput).on('change', function (e) {
					e.stopImmediatePropagation()

					var reader = new FileReader()
					var file = e.target.files[0]

                    if (file.size > 5 * 1024 * 1024) {
                        return alert('Image size should be less than 5 MB')
                    }

					if (['image/jpeg', 'image/png'].indexOf(file.type) === -1) {
						return
					}

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
					$timeout.cancel(this)
				}, 0)
			}
            $scope.removeUpload = function (index) {
                if ($scope.loading) return

                $scope.files = $scope.files.filter(function (file, fileIndex) {
                    if (index == fileIndex) return false
                    return true
                })
            }

			$scope.react = function (post, type, unreact) {
				var action = 'react'
				if (unreact) action = 'unreact'

				$scope.post.youdid[type] = (action == 'react')
				if (type == 'like' && $scope.post.youdid.dislike) {
					$scope.post.youdid.dislike = false
				} else if (type == 'dislike' && $scope.post.youdid.like) {
					$scope.post.youdid.like = false
				}

				// console.log($scope.post.sharedIn)

                /** SHIT_START
				 * TODO: Should be something normal instead of this hack
				 * sharedIn array contains articles IDs.
				 * To update counter according to expected result I`ll change array size
				 * */
				if (!$scope.post.sharedIn) $scope.post.sharedIn = []

                if (type == 'share' && unreact) {
                    $scope.post.sharedIn.pop()
                } else if (type == 'share' && !unreact) {
                    $scope.post.sharedIn.push(null)
                }
                /** SHIT_END */

				reactionsService[action](post._id, type).then(function (result) {
					$rootScope.$emit('reloadreactions', post._id)
				}, function (error) {
					console.error('Reaction failed')
					console.error(error)
				})
			}

			$scope.removePost = function (post) {
				postService.remove(post._id).then(function () {
					$rootScope.$emit('reloadfeed')
				}, function () {
					alert('Unable to remove post. Please, try again later.')
				})
			}
		}
	}
})
.directive('postreactions', function ($rootScope, reactionsService) {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/postreactions.htm',
		scope: {
			post: '='
		},
		link: function ($scope, element, attr) {
			$scope.reactions = {
                expert: {
                    likes: 0,
                    dislikes: 0,
                    shares: 0,
                    smarts: 0,
                    worthys: 0
                },
                journalist: {
                    likes: 0,
                    dislikes: 0,
                    shares: 0,
                    smarts: 0,
                    worthys: 0
                },
                user: {
                    likes: 0,
                    dislikes: 0,
                    shares: 0,
                    smarts: 0,
                    worthys: 0
                },
                total: {
                    likes: 0,
                    dislikes: 0,
                    shares: 0,
                    smarts: 0,
                    worthys: 0
                }
            }
			var init = function () {
				reactionsService.get($scope.post._id).then(function (reactionInfo) {
					$scope.post.youdid = reactionInfo.youdid
					$scope.post.reactions = reactionInfo.reactions
					var reactions = reactionInfo.reactions

					reactions.expert.likes = numeral(reactions.expert.likes).format('0a').toUpperCase()
					reactions.expert.dislikes = numeral(reactions.expert.dislikes).format('0a').toUpperCase()
					reactions.expert.shares = numeral(reactions.expert.shares).format('0a').toUpperCase()
					reactions.expert.smarts = numeral(reactions.expert.smarts).format('0a').toUpperCase()
					reactions.expert.worthys = numeral(reactions.expert.worthys).format('0a').toUpperCase()
					reactions.journalist.likes = numeral(reactions.journalist.likes).format('0a').toUpperCase()
					reactions.journalist.dislikes = numeral(reactions.journalist.dislikes).format('0a').toUpperCase()
					reactions.journalist.shares = numeral(reactions.journalist.shares).format('0a').toUpperCase()
                    reactions.journalist.smarts = numeral(reactions.journalist.smarts).format('0a').toUpperCase()
                    reactions.journalist.worthys = numeral(reactions.journalist.worthys).format('0a').toUpperCase()
                    reactions.user.likes = numeral(reactions.user.likes).format('0a').toUpperCase()
					reactions.user.dislikes = numeral(reactions.user.dislikes).format('0a').toUpperCase()
					reactions.user.shares = numeral(reactions.user.shares).format('0a').toUpperCase()
                    reactions.user.smarts = numeral(reactions.user.smarts).format('0a').toUpperCase()
                    reactions.user.worthys = numeral(reactions.user.worthys).format('0a').toUpperCase()

					$scope.reactions = reactions
					$scope.$apply()
				}, function (error) {
					console.error(error)
				})
			}

			init()

			$rootScope.$on('reloadreactions', function (event, postId) {
				if (postId != $scope.post._id) return
				init()
			})
		},
	}
})
.directive('postcomments', function ($rootScope, postService, commentService) {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/postcomments.htm',
		scope: {
			post: '=',
			nocollapse: '=',
			user: '=',
		},
		link: function ($scope, element, attr) {
			$scope.comments = []

			$rootScope.$on('reloadcomments', function (e, args) {
				init()
			})

			$scope.ordering = '+createdAt'

			$scope.setEditingMode = function (comment, mode) {
				mode = (typeof mode !== 'undefined') ? mode : true

				if (mode) {
					comment.editingText = comment.text.replace(/<br\s*\/?\s*>/gmi, "\r\n")
				} else {
					comment.editingText = null
				}

				comment.editing = mode
			}

			$scope.toggleRemoveImage = function (image) {
				image.removing = !image.removing
			}

			$scope.updateComment = function (comment) {
				$scope.loading = true

				var imagesToRemove = comment.images.map(function (i) {
					if (i.removing) return i._id
				}).filter(function (i) {return !!i})

				console.log(imagesToRemove)

				commentService.update(comment._id, comment.editingText, imagesToRemove, []).then(function (result) {
                    $scope.loading = false
					comment.text = result.data.comment.text
					comment.images = result.data.comment.images
					$scope.setEditingMode(comment, false)
					$scope.$apply()
				})
			}

			$scope.remove = function (comment) {
				commentService.remove(comment._id).then(function (result) {
					if (result.ok == 1 && result.n == 1) {
						comment.removed = true
					}
				})
			}

			var init = function () {
				postService.getComments($scope.post._id).then(function (comments) {
					for (var i in comments) {
						var c = comments[i]
						c.fullText = ''

						if (c.text.length > 500) {
							c.fullText = c.text
							c.text = c.text.substr(0, 500) + '...'
						}

						comments[i] = c
					}

					$scope.comments = comments
					$scope.$parent.commentsCount = $scope.comments.length
					$scope.post.comments = comments
					$scope.$apply()

					$rootScope.$emit('commentsloaded', $scope.post._id)
				})
			}

			init()
		}
	}
})
.directive('commentreactions', function ($rootScope, commentReactionsService) {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/commentreactions.htm',
		scope: {
			comment: '='
		},
		link: function ($scope, element, attr) {
			var init = function () {
				commentReactionsService.get($scope.comment._id).then(function (reactionInfo) {
					$scope.comment.youdid = reactionInfo.youdid

					var reactions = reactionInfo.reactions

					// reactions.likes = numeral(reactions.likes).format('0a').toUpperCase()
					// reactions.dislikes = numeral(reactions.dislikes).format('0a').toUpperCase()

					$scope.comment.likes = reactions.likes
					$scope.comment.dislikes = reactions.dislikes

					$scope.reactions = reactions
					$scope.$apply()
				}, function (error) {
					console.error(error)
				})
			}

			init()

			$rootScope.$on('reloadcommentreactions', function (event, commentId) {
				if (commentId != $scope.comment._id) return
				init()
			})

			$scope.react = function (comment, type, unreact) {
				var action = 'react'
				if (unreact) action = 'unreact'

				$scope.comment.youdid[type] = (action == 'react')
				console.log($scope.reactions[type + 's'])
				$scope.reactions[type + 's'] += (action == 'react') ? 1 : -1
				console.log($scope.reactions[type + 's'])

				if (type == 'like' && $scope.comment.youdid.dislike) {
					$scope.comment.youdid.dislike = false
					$scope.reactions.dislikes--
				} else if (type == 'dislike' && $scope.comment.youdid.like) {
					$scope.comment.youdid.like = false
					$scope.reactions.likes--
				}

				commentReactionsService[action](comment._id, type).then(function (result) {
					$rootScope.$emit('reloadcommentreactions', comment._id)
				}, function (error) {
					console.log('Reaction failed')
					console.log(error)
				})
			}
		},
	}
})
.directive('person', function ($rootScope, followService) {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/person.htm',
		scope: {
			person: '=',
		},
		link: function ($scope, element, attr) {
			if ($scope.person.intro && $scope.person.intro.length > 110) {
				$scope.person.intro = $scope.person.intro.substr(0, 110) + '...'
			}

			angular.element(document.body).on('click', function () {
				$scope.person.menu = false
				$scope.$apply()
			})

			$scope.person.role = $scope.person.role[0].toUpperCase() + $scope.person.role.substr(1)

			// if (typeof $scope.person.isFollowing === 'undefined') {
				followService.isFollowing($scope.person._id).then(function (result) {
					$scope.person.isFollowing = result
				})
			// }

			$scope.toggleFollow = function (person) {
				if (person.isFollowing) {
					followService.unfollow(person._id).then(function (result) {
						$scope.person.isFollowing = result
						$rootScope.$emit('update-follow')
					})
				} else {
					followService.follow(person._id).then(function (result) {
						$scope.person.isFollowing = result
						$rootScope.$emit('update-follow')
					})
				}
			}
		}
	}
})
.directive('question', function (followService, questionsService) {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/question.htm',
		scope: {
			question: '='
		},
		link: function ($scope, element, attr) {

		}
	}
})
.directive('familiarexpert', function ($rootScope, followService, postService) {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/familiar-expert.htm',
		scope: {
			person: '=',
			user: '='
		},
		link: function ($scope, element, attr) {
			$scope.person.role = $scope.person.role[0].toUpperCase() + $scope.person.role.substr(1)

			followService.isFollowing($scope.person._id).then(function (result) {
				$scope.person.isFollowing = result
			})

			$scope.mute = function (person) {
				postService.mute(person._id)
				delete $scope.person
			}

			$scope.follow = function (person) {
				followService.follow(person._id).then(function (result) {
					$scope.person.isFollowing = result
					$rootScope.$emit('update-follow')
				})
			}

			$scope.unfollow = function (person) {
				followService.unfollow(person._id).then(function (result) {
					$scope.person.isFollowing = result
					$rootScope.$emit('update-follow')
				})
			}
		}
	}
})
.directive('friendrequest', function (friendshipService) {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/friend-request.htm',
		scope: {
			user: '=',
            friendshipRequest: '='
		},
		link: function (scope, element, attr) {
            scope.friendshipRequest.user.role = scope.friendshipRequest.user.role[0].toUpperCase() + scope.friendshipRequest.user.role.substr(1)

			scope.accept = function (friendshipRequest) {
				friendshipService.accept(friendshipRequest._id)
				delete scope.friendshipRequest
			}

			scope.decline = function (friendshipRequest) {
                friendshipService.decline(friendshipRequest._id).then(function (result) {
                    delete scope.friendshipRequest
				})
			}
		}
	}
})
.directive('newquestions', function ($rootScope, questionsService, followService) {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/new-questions.htm',
		scope: {
			user: '='
		},
		link: function ($scope, element, attr) {
			$scope.loading = true
			$scope.questions = []

			$scope.init = function () {
				questionsService.get(null, 'active', 0, 3).then(function (questions) {
					$scope.loading = false

					if ($scope.questions.length > 0) {
						for (var i in questions) {
							var newq = questions[i]

							for (var j in $scope.questions) {
								var oldq = $scope.questions[j]

								if (newq._id == oldq._id) {
									oldq.liked = newq.liked
									oldq.likes = newq.likes
								}
							}
						}
					} else {
						$scope.questions = questions.map(function (q) {
							q.author.role = q.author.role[0].toUpperCase() + q.author.role.substr(1)

							if (q.text.length > 100) {
								q.text = q.text.substr(0, 100) + '...'
							}

							return q
						})

						async.mapSeries($scope.questions, function (q, next) {
							followService.isFollowing(q.author._id).then(function (result) {
								q.author.isFollowing = result
								next(null, q)
							})
						}, function (err, questions) {
							$scope.questions = questions
						})
					}
				}).catch(function (error) {
					$scope.loading = false
				})
			}

			$scope.init()
			$rootScope.$on('updateQuestionsCounters', $scope.init)

			$scope.refresh = function () {
				$scope.questions = []
				$scope.loading = true
				$scope.init()
			}

			$scope.follow = function (question) {
				followService.follow(question.author._id).then(function (result) {
					question.author.isFollowing = result
				})
			}

			$scope.like = function (question) {
				questionsService.like(question._id).then(function (data) {
					question.liked = true
					question.likes = data.count;

					$rootScope.$emit('updateQuestionsCounters')
				})
			}
		}
	}
})
.directive('familiarexperts', function (familiarExpertsService) {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/familiar-experts.htm',
		link: function ($scope, element, attr) {
			$scope.init = function () {
				$scope.users = [];
				$scope.familiarExpertsLoading = true;
				familiarExpertsService.get().then(function (users) {
					$scope.users = users;
					$scope.familiarExpertsLoading = false
				})
			};

			$scope.init()
		}
	}
})
.directive('friendshiprequests', function (friendshipService) {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/friend-requests.htm',
		scope: {
			user: '='
		},
		controller: function ($scope) {
            $scope.init = function () {
                $scope.friendshipRequests = [];
                $scope.friendshipRequestsLoading = true;
                friendshipService.pending().then(function (friendshipRequests) {
                    $scope.friendshipRequests = friendshipRequests;
                    $scope.friendshipRequestsLoading = false
                })
            }
        },
		link: function (scope, element, attr) {
			scope.init()
		}
	}
})
.directive('topbar', function ($rootScope) {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/topbar.htm',
		scope: {
			user: '=',
			q: '=?',
		},
		link: function ($scope, element, attr) {
			if (!$scope.q) {
				$scope.q = ''
			}

			$scope.openUserMenu = function (e) {
				e.stopPropagation();
				$rootScope.$broadcast('open-user-menu')
			}
		}
	}
})
.directive('filters', function ($rootScope) {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/filters.htm',
		link: function ($scope, element) {
			$scope.filters = [
				{
					title: 'Top',
					filter: 'top',
				},
				{
					title: 'News',
					filter: 'news',
				},
				{
					title: 'Journalist',
					filter: 'journalist',
				},
				{
					title: 'Expert',
					filter: 'expert',
				},
				{
					title: 'Photos',
					filter: 'photos',
				},
			];

			$scope.activeFilter = 'news';
			$scope.setFilter = function (filter) {
				$scope.activeFilter = filter;
				$rootScope.$emit('feedFilter', filter)
			}
		},
	}
})
.directive('bigratedavatar', function ($timeout, $rootScope) {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/big-rated-avatar.htm',
		scope: {
			user: '=',
			onEdit: '='
		},
		link: function ($scope, element, attr) {
			if (typeof $scope.onEdit === 'function') {
				$scope.editing = true;
				$scope.chooseFile = function () {
					var fileInput = element[0].querySelector('input[type=file]');
					angular.element(fileInput).on('change', function (e) {
						e.stopImmediatePropagation();

						$scope.$apply(function () {
							var file = e.target.files[0];
							$scope.onEdit(file)
						})
					});

					$timeout(function () {
						fileInput.click();
						$timeout.cancel(this)
					}, 0)
				}
			}

			var init = function () {
				var canvas = angular.element(element).find('canvas')[0],
					ctx = canvas.getContext('2d');

				var width = angular.element(element)[0].children[0].offsetWidth,
					height = angular.element(element)[0].children[0].offsetHeight;

				angular.element(element).find('canvas').attr('width', width);
				angular.element(element).find('canvas').attr('height', height);

				var borderWidth = 4;

				var __start = Date.now();
				var levelInfo = $scope.user.xpInfo;
				var __end = Date.now();

				$scope.level = levelInfo.level;
				var levelPercentage = ($scope.user.xp - levelInfo.prevLevelXp) / (levelInfo.nextLevelXp - levelInfo.prevLevelXp) * 100;

				// Get user XP in radians
				if (!$scope.user.xp) return;
				var radsXP = (levelPercentage / 100 * 2) + 1.5;

				ctx.lineWidth = borderWidth;
				ctx.strokeStyle = '#43abe7';
				ctx.beginPath();
				ctx.arc(width / 2, height / 2, (width / 2) - (borderWidth / 2), 1.5 * Math.PI, radsXP * Math.PI, false);
				ctx.stroke()
			};
			init();

			window.onresize = init
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
			viewTitle: '@',
		},
		link: function ($scope, element, attr) {
			$scope.show = false;

			var lastUserValue;

			$scope.$watch('ngModel', function (newValue, oldValue) {
				if (newValue && newValue.title != oldValue.title && oldValue.title != lastUserValue) {
					$scope.filteredSuggestions = [];

					for (var i = 0; i < $scope.suggestions.length; i++) {
						var item = $scope.suggestions[i];

						if (item.title.toLowerCase().indexOf(newValue.title.toLowerCase()) !== -1) {
							$scope.filteredSuggestions.push(item)
						}
					}

					$scope.filteredSuggestions = $scope.filteredSuggestions.slice(0, 7);

					$scope.show = true
				} else {
					$scope.show = false
				}
			}, true);

			$scope.setSuggestion = function (value) {
				lastUserValue = $scope.ngModel.title;
				$scope.ngModel = value;
				$scope.show = false
			}
		}
	}
})
.directive('lightbox', function ($templateRequest, $compile, identityService) {
	return {
		restrict: 'A',
		scope: {
			image: '=',
			post: '=',
			author: '='
		},
		link: function ($scope, element, attr) {
			element.on('click', function () {
				$scope.next = element.next()[0];
				$scope.prev = element.prev()[0];

				identityService.getImageReaction($scope.image._id).then(function (reactions) {
					$scope.$apply(function() {
						$scope.image.reactions = reactions.reactions;
						$scope.image.youdid = reactions.youdid
                    })
				});

				$scope.react = function (type) {
					if ($scope.image.youdid[type]) {
                        identityService.unreactImage($scope.image._id, type).then(function (result) {
							$scope.image.youdid[type] = false;
							$scope.image.reactions[type + 's']--
                        })
					} else {
                        identityService.reactImage($scope.image._id, type).then(function (result) {
                            $scope.image.youdid[type] = true;
                            $scope.image.reactions[type + 's']++
                        })
					}
				};

				$templateRequest('assets/views/directives/lightbox.htm').then(function (html) {
					var template = angular.element(html);
					angular.element(document.body).append(template);

					$compile(template)($scope);

					template.find('.wrapper').on('click', function (e) {
						e.stopImmediatePropagation()
					});
                    template.find('avatar').on('click', function (e) {
                        template.remove()
                    });

					template.on('click', function () {
						template.remove()
					});

					if ($scope.next && $scope.next.attributes.lightbox) {
						$scope.showNext = function () {
							template.remove();
							// $timeout(function () {
								angular.element($scope.next).triggerHandler('click');
							// })
						}
					}

					if ($scope.prev && $scope.prev.attributes.lightbox) {
						$scope.showPrev = function () {
							template.remove();
							// $timeout(function () {
								angular.element($scope.prev).triggerHandler('click');
							// })
						}
					}
				})
			})
		}
	}
})
.directive('pieces', function (piecesService) {
	return {
		restric: 'E',
		templateUrl: 'assets/views/directives/pieces.htm',
		link: function ($scope, element, attr) {
			piecesService.get().then(function (result) {
				$scope.pieces = result
			}, function () {})
		}
	}
})
.directive('profilecard', function () {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/profilecard.htm',
		scope: {
			user: '=',
		},
		link: function ($scope, element, attr) {
			$scope.image = $scope.user.avatar || '/assets/images/avatar_placeholder.png'
		}
	}
})
.directive('followersicon', function ($rootScope, $interval, $timeout, followService) {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/followersicon.htm',
		scope: {
			user: '=',
		},
		link: function ($scope, element, attr) {
			$scope.count = $rootScope.badgeFollowers || 0;

			$scope.toggleFollow = function (person, $event) {
				$event.stopImmediatePropagation();

				if (person.isFollowing) {
					followService.unfollow(person._id).then(function (result) {
						person.isFollowing = result
					})
				} else {
					followService.follow(person._id).then(function (result) {
						person.isFollowing = result
					})
				}
			};

			angular.element(document.body).on('click', function () {
				$scope.dropdownVisible = false;
				$scope.$apply()
			});

			var updateFollowers = function () {
				async.parallel([
					function (cb) {
						followService.followers($scope.user._id, 0, 10, ['createdAt', 'desc']).then(function (followers) {
							followers = followers.map(function (person) {
								person.role = person.role[0].toUpperCase() + person.role.substr(1);
								return person
							});

							$scope.followers = followers;

							cb()
						})
					},
					function (cb) {
						followService.unread().then(function (count) {
							$scope.count = $rootScope.badgeFollowers = count;

							cb()
						})
					}
				], function () {
					// $scope.$apply()
				})
			};

			$scope.showDropdown = function (e) {
				e.stopImmediatePropagation();

				$timeout(function () {
					document.body.click();
					$scope.dropdownVisible = !$scope.dropdownVisible;

					followService.setReadForUser().then(function () {
						$scope.count = $rootScope.badgeFollowers = 0
					})
				}, 10)
			};

			// $interval(updateFollowers, 3000)
			updateFollowers()
		},
	}
})
.directive('notificationsicon', function ($rootScope, $interval, $timeout, notificationService) {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/notificationsicon.htm',
		scope: {
			user: '=',
		},
		replace: false,
		link: function ($scope, element, attr) {
			$scope.notifications = [];
			$scope.count = $rootScope.badgeNotifications || 0;

			angular.element(document.body).on('click', function () {
				$scope.dropdownVisible = false;
				$scope.$apply()
			});

			var updateNotifications = function (callback) {
				notificationService.get().then(function (result) {
					$scope.count = $rootScope.badgeNotifications = result.count;
					$scope.notifications = result.notifications;

					if (typeof callback === 'function') callback()
				})
			};

			var refreshInterval = $interval(function () {
				if ($scope.dropdownVisible) return;
				updateNotifications()
			}, 3000);

			element.on('$destroy', function () {
				$interval.cancel(refreshInterval)
			});

			$scope.showDropdown = function (e) {
				e.stopImmediatePropagation();

				$timeout(function () {
					document.body.click();
					$scope.dropdownVisible = !$scope.dropdownVisible;

					notificationService.setReadForUser().then(function () {
						for (var i in $scope.notifications) {
							$scope.notifications[i].read = true
						}

						$scope.count = 0
					})
				}, 10)
			};

			updateNotifications()
		}
	}
})
.directive('wallpaperblock', function ($rootScope, followService, friendshipConfirmModal, friendshipService) {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/wallpaperblock.htm',
		scope: {
			type: '=',
			user: '=',
			profile: '=',
		},
		link: function ($scope, element, attr) {
			$scope.follow = function (profile) {
				followService.follow(profile._id).then(function (result) {
					$scope.profile.isFollowing = result;
					$rootScope.$emit('update-follow')
				})
			};

			$scope.unfollow = function (profile) {
				followService.unfollow(profile._id).then(function (result) {
					$scope.profile.isFollowing = result;
					$rootScope.$emit('update-follow')
				})
			};

            $scope.addContact = function (userID) {
                friendshipConfirmModal.activate({$parent: $scope, userID: userID})
            };

            $scope.removeContact = function (userID) {
                friendshipService.remove(userID).then(function (data) {
                    $scope.profile.friendship = data
                }, function (error) {
                    console.log(error);
                })
            };
            $scope.acceptFriendship = function (requestID) {
                friendshipService.accept(requestID).then(function (result) {
                    $scope.profile.friendship = result
                })
            };

            $scope.declineFriendship = function (requestID) {
                friendshipService.decline(requestID).then(function (result) {
                    $scope.profile.friendship = null
                })
            }
        },
	}
})
.directive('profileinfo', function (identityService) {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/profileinfo.htm',
		scope: {
			profile: '=',
		},
		link: function ($scope, element, attr) {
			identityService.images($scope.profile._id).then(function (images) {
				$scope.images = images
			})
		},
	}
})
.directive('search', function (identityService, $location) {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/search.htm',
		scope: {
			q: '=',
		},
		link: function ($scope, element, attr) {
			$scope.dropdownVisible = false;
			$scope.loading = false;

			angular.element(document.body).on('click', function () {
				$scope.dropdownVisible = false;
				$scope.$apply()
			});

			$scope.multisearch = function () {
				var q = $scope.q.trim();

				if (!q) {
					$scope.dropdownVisible = false;
					return
				}

				$scope.loading = true;

				identityService.multisearch($scope.q).then(function (results) {
					results.users = results.users.map(function (user) {
						user.avatar = user.avatar || '/assets/images/avatar_placeholder.png';
						user.role = user.role[0].toUpperCase() + user.role.substr(1);
						return user
					});

					$scope.results = results;

					$scope.loading = false;
					$scope.dropdownVisible = true
				})
			};

			element.find('form').on('submit', function (e) {
				e.preventDefault();
				$location.path('/tagsearch/' + $scope.q);
				$scope.$apply()
			})
		},
	}
})
.directive('messagesicon', function ($interval, messagesService) {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/messagesicon.htm',
		scope: {
			q: '=',
		},
		link: function ($scope, element) {
			var updateUnreadCounter = function () {
				messagesService.unread().then(function (result) {
					$scope.unreadcount = result.count
				})
			};

			var refreshInterval = $interval(function () {
				updateUnreadCounter()
			}, 3000);

			element.on('$destroy', function () {
				$interval.cancel(refreshInterval)
			});

			updateUnreadCounter()
		}
	}
})
.directive('onlineflag', function (identityService) {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/onlineflag.htm',
		scope: {
			profile: '=',
		},
		link: function ($scope) {
			$scope.loaded = false;

			identityService.isOnline($scope.profile._id).then(function (flag) {
				$scope.isOnline = flag;
				$scope.lastVisit = $scope.profile.lastVisit;
				$scope.loaded = true
			})
		}
	}
})
.directive('photos', function (identityService) {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/photos.htm',
		scope: {
			images: '=',
		},
		link: function ($scope) {
			$scope.images = $scope.images.map(function (image) {
				image.privacy = image.privacy || 'Stranger';
				image.originalPrivacy = image.privacy;
				return image
			});

			console.log($scope.images);

			$scope.remove = function (image) {
				identityService.removeImage(image._id).then(function (result) {
					if (result.n == 1) {
						$scope.images = $scope.images.filter(function (item) {
							return !(image._id == item._id)
						})
					}
				})
			};

			$scope.privacyOptions = ['Family', 'Close friend', 'Friend', 'Stranger'];
			$scope.setPrivacy = function (image) {
				identityService.setImagePrivacy(image._id, image.privacy).catch(function (result) {
					image.privacy = image.originalPrivacy
				})
			}
		}
	}
})
.directive('linkpreview', function (identityService) {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/link-preview.htm',
		scope: {
			meta: '=',
		}
	}
})
.directive('dropmenu', function (identityService) {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/directives/dropmenu.htm',
		scope: {
			nostranger: '@',
			privacy: '=',
		},
		link: function ($scope) {
            if (!$scope.privacy) $scope.privacy = 'Stranger';
            $scope.activeMnu = false;
            $scope.items = ['Family', 'Close friend', 'Friend'];

            console.log($scope)
            console.log($scope.nostranger)
            if (!$scope.nostranger) {
            	$scope.items.push('Stranger')
			}

            $scope.select = function (option) {
                $scope.privacy = option;
                console.log($scope.privacy);
                $scope.activeMnu = false;
            }
            angular.element(document.body).on('click', function () {
                $scope.activeMnu = false
            })

        }
	}
})