angular.module('er.filters', [])
.filter('tags', function () {
	return function (input) {
		input = input || ''
		return input.replace(/#([a-z0-9]+)/gi, '<a href="#!/tag/$1" class="text-tag">#$1</a>')
	}
})
.filter('people', function () {
	return function (input) {
		input = input || ''
		return input.replace(/@([a-z0-9]+)/gi, '<a href="#!/people/$1" class="text-people">@$1</a>')
	}
})
.filter('categories', function () {
	return function (input) {
		input = input || ''
		return input.replace(/\$([a-z0-9]+)/gi, '<a href="#!/category/$1" class="text-category">$$1</a>')
	}
})
.filter('textLinks', function ($filter) {
	return function (input) {
		input = input || ''
		input = $filter('tags')(input)
		input = $filter('people')(input)
		input = $filter('categories')(input)

		return input
	}
})