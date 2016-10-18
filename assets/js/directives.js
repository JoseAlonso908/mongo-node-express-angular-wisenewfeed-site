angular.module('er.directives', [])
.directive('avatar', function () {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/avatar.htm',
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
		templateUrl: 'assets/views/post.htm',
		scope: {
			post: '='
		},
		link: function ($scope, element, attr) {
			$scope.user = $scope.$parent.user
		}
	}
})
.directive('familiarexpert', function () {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/familiar-expert.htm',
		scope: {
			user: '='
		},
	}
})
.directive('familiarexperts', function () {
	return {
		restrict: 'E',
		templateUrl: 'assets/views/familiar-experts.htm',
		link: function ($scope, element, attr) {
			$scope.users = [
				{
					id: 1,
					name: 'Keanu Reeves',
					image: 'https://s.aolcdn.com/hss/storage/midas/627f1d890718ff2c58318a280145a153/203216448/nicholas-cage-con-air.jpg',
					color: 'bronze',
					rating: 2,
					likes_percentage: 70,
				},
				{
					id: 2,
					name: 'Keanu Reeves',
					image: 'https://s.aolcdn.com/hss/storage/midas/627f1d890718ff2c58318a280145a153/203216448/nicholas-cage-con-air.jpg',
					color: 'bronze',
					rating: 2,
					likes_percentage: 70,
				},
				{
					id: 3,
					name: 'Keanu Reeves',
					image: 'https://s.aolcdn.com/hss/storage/midas/627f1d890718ff2c58318a280145a153/203216448/nicholas-cage-con-air.jpg',
					color: 'bronze',
					rating: 2,
					likes_percentage: 70,
				},
			]
		}
	}
})