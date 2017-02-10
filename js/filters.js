angular.module('er.filters', [])
.filter('br2nl', function () {
	return function (input) {
		input = input || ''
		return input.replace(/<br\s*\/?\s*>/gmi, "\r\n")
	}
})
.filter('tags', function () {
	return function (input) {
		input = input || ''

		// input = input.replace(new RegExp('<br>', 'gi'), "\r\n")

		return input.replace(/(<br>|<q>|<\/q>|^|\s|&nbsp;)#([a-z]+[a-z0-9]+)/gmi, function (match, space, tag, offset, string) {
			return space + '<a href="#!/tagsearch/%23' + tag + '" class="text-tag">#' + tag + '</a>'
		})
	}
})
.filter('countries', function () {
    return function (input) {
        input = input || ''
        return input.replace(/(<br>|<q>|<\/q>|^|\s|&nbsp;)!([a-z]+[a-z0-9]+)/gmi, '$1<a href="#!/tagsearch/!$2" class="text-people">!$2</a>')
    }
})
.filter('people', function () {
	return function (input) {
		input = input || ''
		return input.replace(/(<br>|<q>|<\/q>|^|\s|&nbsp;)@([a-z]+[a-z0-9]+)/gmi, '$1<a href="#!/tagsearch/@$2" class="text-people">@$2</a>')
	}
})
.filter('categories', function () {
	return function (input) {
		input = input || ''
		return input.replace(/(<br>|<q>|<\/q>|^|\s|&nbsp;)\$([a-z]+[a-z0-9]+)/gmi, '$1<a href="#!/tagsearch/$$$2" class="text-category">$$$2</a>')
	}
})
.filter('textLinks', function ($filter) {
	return function (input) {
		input = input || ''
		input = $filter('tags')(input)
		input = $filter('people')(input)
		input = $filter('countries')(input)
		input = $filter('categories')(input)

		return input
	}
})
.filter('encodeuri', function () {
	return function (input) {
		return encodeURIComponent(input)
	}
})
.filter('embedvideos', function ($sce) {
	var ytbRegex = new RegExp('https?:&#47;&#47;(www\.)?youtu\.?be(\.com&#47;watch\\?v=|&#47;)([a-zA-Z0-9_-]+)', 'i')
	var vimeoRegex = new RegExp('https?:&#47;&#47;(www\.)?vimeo\.com&#47;([0-9]+)', 'i')

	return function (input) {
		input = input.replace(ytbRegex, '<iframe width="100%" height="285" src="//www.youtube.com/embed/$3" frameborder="0" allowfullscreen></iframe>')
		input = input.replace(vimeoRegex, '<iframe width="100%" height="285" src="//player.vimeo.com/video/$2" frameborder="0" allowfullscreen></iframe>')

		return $sce.trustAsHtml(input)
	}
})
.filter('url', function ($sce) {
	var protocol = '(?:(?:[a-z]+:)?(&#47;&#47;|//))';
	var auth = '(?:\\S+(?::\\S*)?@)?';
	var ip = '(?:[0-9]{,3}\.[0-9]{,3}\.[0-9]{,3}\.[0-9]{,3})';
	var host = '(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)';
	var domain = '(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*';
	var tld = '(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))\\.?';
	var port = '(?::\\d{2,5})?';
	var path = '(?:[(&#47;/)?#][^\\s"]*)?';
	var regex = '(^|\\s+|<br>)((?:' + protocol + '|www\\.)' + auth + '(?:localhost|' + ip + '|' + host + domain + tld + ')' + port + path + ')';

	var urlRegex = new RegExp(regex, 'mig')

	return function (input) {
		input = input.toString()
		input = input.replace(urlRegex, '<a target="_blank" href="$2">$2</a>')
		return $sce.trustAsHtml(input)
	}
})
.filter('cut', function () {
	return function (value, wordwise, max, tail) {
		if (!value) return ''

		max = parseInt(max, 10)
		if (!max) return value
		if (value.length <= max) return value

		value = value.substr(0, max)
		if (wordwise) {
			var lastspace = value.lastIndexOf(' ')
			if (lastspace != -1) {
				if (value.charAt(lastspace-1) == '.' || value.charAt(lastspace-1) == ',') {
					lastspace = lastspace - 1
				}
				value = value.substr(0, lastspace)
			}
		}
		return value + (tail || ' …')
	};
});
