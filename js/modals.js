angular.module('er.modals', [])
.factory('confirmPhoneModal', function (btfModal) {
	return btfModal({
		controller: 'confirmPhoneModalController',
		controllerAs: 'modal',
		templateUrl: 'assets/views/modals/confirm-account.htm',
	})
})
.controller('confirmPhoneModalController', function ($scope, $parent, $interval, phone, callback, confirmPhoneModal, verifyPhoneService, verifyPhoneCodeService) {
	$scope.phone = phone

	$scope.maxResendTimerValue = 30
	$scope.errormessage = ''

	var sendCode = function () {
		$scope.resendTimer = $scope.maxResendTimerValue
		$scope.errormessage = ''

		$scope.ready = false
		$scope.loading = true
		verifyPhoneService(phone).then(function () {
			$scope.ready = true
			$scope.loading = false

			$interval(function () {
				$scope.resendTimer--
			}, 1000, $scope.maxResendTimerValue)
		}, function (error) {
			$scope.ready = true
			$scope.loading = false

			$scope.errormessage = error
			console.log(error)
		})
	}
	sendCode()

	$scope.close = function () {
		confirmPhoneModal.deactivate()
		callback(false)
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
			confirmPhoneModal.deactivate()
			callback(true)
			console.log(response)
		}, function (error) {
			$scope.loading = false
			$scope.codeError = true
			console.log(error)
		})
	}
})

.factory('confirmAccountModal', function (btfModal) {
	return btfModal({
		controller: 'confirmAccountModalController',
		controllerAs: 'modal',
		templateUrl: 'assets/views/modals/confirm-account.htm',
	})
})
.controller('confirmAccountModalController', function ($scope, $parent, $interval, phone, confirmAccountModal, verifyPhoneService, verifyPhoneCodeService) {
	$scope.phone = phone

	$scope.maxResendTimerValue = 30

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

			try {
				window.localStorage.satellizer_token = response.token
			} catch (e) {
				console.error('localStorage is not supported', e)
			}

			findMyAccountModal.deactivate()
		}, function (error) {
			$scope.codeLoading = false
			$scope.codeValidationError = error
		})
	}
})
.factory('reportModal', function (btfModal) {
	return btfModal({
		controller: 'reportModalController',
		controllerAs: 'modal',
		templateUrl: 'assets/views/modals/reported.htm',
	})
})
.controller('reportModalController', function ($scope, $parent, reportModal) {
	$scope.close = reportModal.deactivate
})
.factory('friendshipConfirmModal', function (btfModal) {
    return btfModal({
        controller: 'friendshipConfirmModalController',
        controllerAs: 'modal',
        templateUrl: 'assets/views/modals/friendship-confirm.htm',
    })
})
.controller('friendshipConfirmModalController', function ($scope, $parent, userID, friendshipConfirmModal, friendshipService) {
    $scope.types = ['Family', 'Close friend', 'Friend']
    $scope.type = 'Friend'

    $scope.close = friendshipConfirmModal.deactivate
	$scope.validatePhone = function (input) {
		var phoneRegex = /^([0-9]{8,15})$/
		return phoneRegex.test(input)
    }
    $scope.confirm = function () {
    	$scope.phoneError = false
        if (!$scope.phone || !$scope.validatePhone($scope.phone)) {
			$scope.error = 'Invalid phone number format'
            return $scope.phoneError = true
		}

        $scope.loading = true
        friendshipService.add(userID, '+' + $scope.phone, $scope.type).then(function (data) {
            $parent.profile.friendship = data
            $scope.loading = false
            $scope.added = true
        }, function (error) {
            $scope.loading = false
            $scope.error = 'Phone number is not fit. Please, try again'
        })
    }
})