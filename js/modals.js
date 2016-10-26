angular.module('er.modals', [])
.factory('confirmAccountModal', function (btfModal) {
	return btfModal({
		controller: 'confirmAccountModalController',
		controllerAs: 'modal',
		templateUrl: 'assets/views/modals/confirm-account.htm',
	})
})
.controller('confirmAccountModalController', function ($scope, $parent, $interval, phone, confirmAccountModal, verifyPhoneService, verifyPhoneCodeService) {
	$scope.phone = phone

	$scope.maxResendTimerValue = 1

	var sendCode = function () {
		$scope.resendTimer = $scope.maxResendTimerValue

		$scope.ready = false
		$scope.loading = true
		verifyPhoneService(phone).then(function () {
			$scope.ready = true
			$scope.loading = false

			$interval(function () {
				$scope.resendTimer--
			}, 1000, $scope.maxResendTimerValue)
		})
	}
	sendCode()

	$scope.close = function () {
		confirmAccountModal.deactivate()
		$parent.doneSignup(false)
	}

	$scope.resend = function () {
		if ($scope.resendTimer == 0) {
			sendCode()
		}
	}

	$scope.confirm = function () {
		if (!$scope.code) {
			return $scope.codeError = true
		}

		$scope.loading = true
		verifyPhoneCodeService(phone, $scope.code).then(function (response) {
			$scope.loading = false
			confirmAccountModal.deactivate()
			$parent.doneSignup(true)
			console.log(response)
		}, function (error) {
			$scope.loading = false
			$scope.codeError = true
			console.log(error)
		})
	}
})
.factory('forgotPasswordModal', function (btfModal) {
	return btfModal({
		controller: 'forgotPasswordModalController',
		controllerAs: 'modal',
		templateUrl: 'assets/views/modals/forgot-password.htm',
	})
})
.controller('forgotPasswordModalController', function ($scope, $parent, forgotPasswordModal, forgotPasswordService) {
	$scope.close = forgotPasswordModal.deactivate

	$scope.confirm = function () {
		$scope.emailError = false
		if (!$scope.email) return $scope.emailError = true

		$scope.loading = true
		forgotPasswordService($scope.email).then(function (data) {
			$scope.loading = false
			$scope.sent = true
		}, function (error) {
			$scope.loading = false
			$scope.error = error
		})
	}
})
.factory('findMyAccountModal', function (btfModal) {
	return btfModal({
		controller: 'findMyAccountModalController',
		controllerAs: 'modal',
		templateUrl: 'assets/views/modals/find-my-account.htm',
	})
})
.controller('findMyAccountModalController', function ($scope, $parent, $location, findMyAccountModal, findAccountRequestService, findAccountSigninService) {
	$scope.close = findMyAccountModal.deactivate

	$scope.confirm = function () {
		$scope.error = ''
		$scope.inputError = false
		if (!$scope.input) return $scope.inputError = true

		$scope.requestLoading = true
		findAccountRequestService($scope.input).then(function (data) {
			$scope.requestLoading = false
			$scope.codeSent = true
		}, function (error) {
			$scope.requestLoading = false
			$scope.error = error
			console.error(error)
		})
	}

	$scope.signIn = function () {
		$scope.codeValidationError = ''
		$scope.codeError = false
		if (!$scope.code) return $scope.codeError = true

		$scope.codeLoading = true
		findAccountSigninService($scope.code).then(function (response) {
			$scope.codeLoading = false
			$location.url('/')
			window.localStorage.satellizer_token = response.token
			findMyAccountModal.deactivate()
		}, function (error) {
			$scope.codeLoading = false
			$scope.codeValidationError = error
		})
	}
})