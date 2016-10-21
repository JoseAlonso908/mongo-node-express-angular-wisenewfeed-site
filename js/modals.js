angular.module('er.modals', [])
.factory('confirmAccountModal', function (btfModal) {
	return btfModal({
		controller: 'confirmAccountModalController',
		controllerAs: 'modal',
		templateUrl: 'assets/views/modals/confirm-account.htm'
	})
})
.controller('confirmAccountModalController', function ($scope, $parent, confirmAccountModal, $timeout) {
	$scope.close = function () {
		confirmAccountModal.deactivate()
		$parent.doneSignup(false)
	}

	$scope.confirm = function () {
		if (!$scope.code) {
			return $scope.codeError = true
		}

		$scope.loading = true
		$timeout(function () {
			if ($scope.code == 'test') {
				confirmAccountModal.deactivate()
				$parent.doneSignup(true)
			} else {
				$scope.codeError = true
				$scope.loading = false
			}
		}, 1000)
	}

	$scope.resend = function () {

	}
})