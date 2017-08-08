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

		return input.replace(/(>|^|\s|&nbsp;)#([a-z]+[a-z0-9]+)/gmi, function (match, space, tag, offset, string) {
			return space + '<a href="#!/tagsearch/%23' + tag + '" class="text-tag">#' + tag + '</a>'
		})
	}
})
.filter('countries', function () {
    return function (input) {
        input = input || ''
        return input.replace(/(>|^|\s|&nbsp;)!([a-z]+[a-z0-9]+)/gmi, '$1<a href="#!/tagsearch/!$2" class="text-people">!$2</a>')
    }
})
.filter('people', function () {
	return function (input) {
		input = input || ''
		return input.replace(/(>|^|\s|&nbsp;)@([a-z]+[a-z0-9]+)/gmi, '$1<a href="#!/tagsearch/@$2" class="text-people">@$2</a>')
	}
})
.filter('categories', function () {
	return function (input) {
		input = input || ''
		return input.replace(/(>|^|\s|&nbsp;)\$([a-z]+[a-z0-9]+)/gmi, '$1<a href="#!/tagsearch/$$$2" class="text-category">$$$2</a>')
	}
})
.filter('textLinks', function ($filter) {
    var decodeHtmlEntity = function(str) {
        return str.replace(/&#(\d+);/g, function(match, dec) {
            return String.fromCharCode(dec);
        });
    };

    return function (input) {
		input = input || ''
		input = decodeHtmlEntity(input)
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
	var ytbRegex = new RegExp('https?:(&#47;&#47;|\/\/)(www\.)?youtu\.?be(\.com(&#47;|\/)watch\\?v=|(&#47;|\/))([a-zA-Z0-9_-]+)', 'i')
	var vimeoRegex = new RegExp('https?:(&#47;&#47;|\/\/)(www\.)?vimeo\.com(&#47;|\/)([0-9]+)', 'i')

    return function (input) {
		input = input.replace(ytbRegex, '<iframe width="100%" height="285" src="//www.youtube.com/embed/$6" frameborder="0" allowfullscreen></iframe>')
		input = input.replace(vimeoRegex, '<iframe width="100%" height="285" src="//player.vimeo.com/video/$4" frameborder="0" allowfullscreen></iframe>')

		return $sce.trustAsHtml(input)
	}
})
.filter('url', function ($sce) {
	// TODO: info available at http://stackoverflow.com/questions/37684/how-to-replace-plain-urls-with-links/21925491#21925491

	return function (input) {
		/* function from  : https://gist.github.com/CatTail/4174511 */
        var decodeHtmlEntity = function(str) {
            return str.replace(/&#(\d+);/g, function(match, dec) {
                return String.fromCharCode(dec);
            });
        };
        var replacedText, replacePattern1, replacePattern2, replacePattern3;
        input = input.toString()
        input = decodeHtmlEntity(input)

        //URLs starting with http://, https://, or ftp://
        replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
        replacedText = input.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');

        //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
        replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
        replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');

        //Change email addresses to mailto:: links.
        replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
        replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');
		return $sce.trustAsHtml(replacedText)
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
	}
})
.filter('removehtml', function () {
    var decodeHtmlEntity = function(str) {
        return str.replace(/&#(\d+);/g, function(match, dec) {
            return String.fromCharCode(dec)
        })
    }
	return function (input) {
        if (!input) return ''
        input = decodeHtmlEntity(input)
        input = input.replace(/<br\s*\/?\s*>/gmi, "\r\n").replace(/&nbsp;/gmi, ' ').replace(/&amp;/gmi, '&')
        return input
	}
})
.filter('gender', function () {
    return function (items, value) {
        if (value && value.title != 'Any') {
            var filtered = [];
            angular.forEach(items, function (item) {
                if (item.gender == value.title.toLowerCase()) {
                    filtered.push(item);
                }
            });
            return filtered;
        } else {
            return items;
        }
    }
})
.filter('city', function () {
    return function (items, value) {
        if (value && value.title !== 'All') {
            var filtered = [];
            angular.forEach(items, function (item) {
                if (item.city == value.title) {
                    filtered.push(item);
                }
            });
            return filtered;
        } else {
            return items;
        }
    }

})
.filter('country', function () {
    return function (items, value) {
        if (value && value.title !== 'All') {
            var filtered = [];
            angular.forEach(items, function (item) {
                if (item.country == value.title) {
                    filtered.push(item);
                }
            });
            return filtered;
        } else {
            return items;
        }
    }
});
