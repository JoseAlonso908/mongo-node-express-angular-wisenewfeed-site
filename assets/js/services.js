angular.module('er.services', [])
.factory('dropdowns', function () {
	return function () {
		var dropdownButtons = angular.element(document.querySelectorAll('.menu-buttons.dropdown')),
			dropdownLists = angular.element(document.querySelectorAll('.dropdown-list')),
			body = angular.element(document.body)

		body.on('click', function () {dropdownLists.removeClass('active')})

		dropdownButtons.on('click', function (e) {
			e.stopImmediatePropagation()

			var dropdownId = angular.element(this).attr('dropdown-id')
			angular.element(document.querySelector('.dropdown-list[dropdown-id="' + dropdownId + '"]')).toggleClass('active')
		})
	}
})
.factory('categoriesDropdown', function () {
	var dropdownButton = angular.element(document.querySelector('.menu-buttons.dropdown[dropdown-id=categories]')),
		dropdownList = angular.element(document.querySelector('.dropdown-list[dropdown-id=categories]'))

	dropdownList.on('click', function (e) {e.stopImmediatePropagation()})

	var result = {}

	result.categories = [
		{id: 1, title: 'World News', count: 353478392},
		{id: 2, title: 'Canada News', count: 12478392},
		{id: 3, title: 'Buzz News', count: 4478392},
		{id: 4, title: 'Science', count: 2478392},
		{id: 5, title: 'Business', count: 532952},
		{id: 6, title: 'Health', count: 422321},
		{id: 7, title: 'Technology', count: 352210},
		{id: 8, title: 'Sport', count: 24990},
		{id: 9, title: 'Entertainment', count: 1224},
	]

	result.chosenCategory = result.categories[1]

	result.activeCategoryClass = function (cat) {
		return {'active': (cat.id === result.chosenCategory.id)}
	}

	result.setActiveCategory = function (cat) {
		result.chosenCategory = cat
		dropdownList.removeClass('active')
	}

	for (var i in result.categories) {
		result.categories[i].countShort = numeral(result.categories[i].count).format('0a').toUpperCase()
	}

	return result
})
.factory('countriesDropdown', function () {
	var dropdownButton = angular.element(document.querySelector('.menu-buttons.dropdown[dropdown-id=countries]')),
		dropdownList = angular.element(document.querySelector('.dropdown-list[dropdown-id=countries]'))

	dropdownList.on('click', function (e) {e.stopImmediatePropagation()})

	var result = {}

	result.countries = [
		{id: 1, title: 'North America', sub: [
			{id: 2, title: 'United States'},
			{id: 3, title: 'Canada'},
			{id: 4, title: 'Mexico'},
		]},
		{id: 5, title: 'Central & South America', sub: [
			{id: 6, title: 'Brazil'},
			{id: 7, title: 'Chile'},
			{id: 8, title: 'Argentina'},
		]}
	]

	result.chosenCountry = result.countries[0].sub[0]

	result.activeRegionClass = function (region) {
		var active = false

		for (var i in region.sub) {
			if (region.sub[i].id === result.chosenCountry.id) active = true
		}

		return {active: active}
	}

	result.activeCountryClass = function (country) {
		return {
			active: result.chosenCountry.id === country.id
		}
	}

	result.setActiveCountry = function (country) {
		result.chosenCountry = country
		dropdownList.removeClass('active')
	}

	return result
})