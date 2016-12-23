angular.module('er.filters', [])
.filter('tags', function () {
	return function (input) {
		input = input || ''

		// input = input.replace(new RegExp('<br>', 'gi'), "\r\n")

		return input.replace(/(<br>|<q>|<\/q>|^|\s)#([a-z]+[a-z0-9]+)/gmi, function (match, space, tag, offset, string) {
			return space + '<a href="#!/tagsearch/%23' + tag + '" class="text-tag">#' + tag + '</a>'
		})
	}
})
.filter('people', function () {
	return function (input) {
		input = input || ''
		return input.replace(/(<br>|<q>|<\/q>|^|\s)@([a-z]+[a-z0-9]+)/gmi, '$1<a href="#!/tagsearch/@$2" class="text-people">@$2</a>')
	}
})
.filter('categories', function () {
	return function (input) {
		input = input || ''
		return input.replace(/(<br>|<q>|<\/q>|^|\s)\$([a-z]+[a-z0-9]+)/gmi, '$1<a href="#!/tagsearch/$$$2" class="text-category">$$$2</a>')
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
.filter('encodeuri', function () {
	return function (input) {
		return encodeURIComponent(input)
	}
})