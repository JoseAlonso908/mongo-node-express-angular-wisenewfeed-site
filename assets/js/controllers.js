angular.module('er.controllers', [])
.controller('homeController', function ($scope, categoriesDropdown, countriesDropdown, dropdowns) {
	dropdowns()

	$scope.cats = categoriesDropdown
	$scope.countries = countriesDropdown

	$scope.r_tags = ['Tag 1', 'Tag 2', 'Tag 3', 'Tag 4', 'Tag 5']
	$scope.r_people = ['Guy 1', 'Guy 2', 'Guy 3', 'Guy 4', 'Guy 5', 'Guy 6', 'Guy 7']
	$scope.r_categories = ['Category 1', 'Category 2', 'Category 3', 'Category 4']

	$scope.user = {
		name: 'Jack Daniels',
		avatar: 'http://i.imgur.com/wq43v5T.jpg',
		rating: 1,
		color: 'bronze',
	}

	$scope.feed = [
		{
			id: 1,
			author: {
				name: 'Nicholas Cage',
				avatar: 'https://s.aolcdn.com/hss/storage/midas/627f1d890718ff2c58318a280145a153/203216448/nicholas-cage-con-air.jpg',
				rating: 1,
				color: 'gold',
				position: 'Director',
				country: 'United States',
			},
			createdAt: new Date(Date.now() - (Math.round(Math.random() * 1000) * 1000)),
			text: 'Lorem ipsum dolor sit amet, neglegentur vituperatoribus cum ei. Facete dolorum aliquando duo ne, pro an delenit praesentea perpetua adipisc eos, civibus.',
			image: 'https://s.aolcdn.com/hss/storage/midas/627f1d890718ff2c58318a280145a153/203216448/nicholas-cage-con-air.jpg',
			ratings: {
				expert: {
					likes: 12432,
					dislikes: 4230,
					shares: 1320,
				},
				journalist: {
					likes: 12432,
					dislikes: 4230,
					shares: 1320,
				},
				visitor: {
					likes: 12432,
					dislikes: 4230,
					shares: 1320,
				},
			},
			comments: [
				{
					id: 2,
					author: {
						name: 'Nicholas Cage',
						avatar: 'https://s.aolcdn.com/hss/storage/midas/627f1d890718ff2c58318a280145a153/203216448/nicholas-cage-con-air.jpg',
						rating: 2,
						color: 'silver',
						position: 'Director',
						country: 'United States',
					},
					createdAt: new Date(Date.now() - (Math.round(Math.random() * 1000) * 1000)),
					text: 'Lorem ipsum dolor sit amet, neglegentur vituperatoribus cum ei. Facete dolorum aliquando! #DieHard',
					likes: 12,
					dislikes: 1
				}
			]
		},

		{
			id: 1,
			author: {
				name: 'Nicholas Cage',
				avatar: 'https://s.aolcdn.com/hss/storage/midas/627f1d890718ff2c58318a280145a153/203216448/nicholas-cage-con-air.jpg',
				rating: 1,
				color: 'gold',
				position: 'Director',
				country: 'United States',
			},
			createdAt: new Date(Date.now() - (Math.round(Math.random() * 1000) * 1000)),
			text: 'Lorem ipsum dolor sit amet, neglegentur vituperatoribus cum ei. Facete dolorum aliquando duo ne, pro an delenit praesentea perpetua adipisc eos, civibus.',
			image: 'https://s.aolcdn.com/hss/storage/midas/627f1d890718ff2c58318a280145a153/203216448/nicholas-cage-con-air.jpg',
			ratings: {
				expert: {
					likes: 12432,
					dislikes: 4230,
					shares: 1320,
				},
				journalist: {
					likes: 12432,
					dislikes: 4230,
					shares: 1320,
				},
				visitor: {
					likes: 12432,
					dislikes: 4230,
					shares: 1320,
				},
			},
		}
	]

	for (var i in $scope.feed) {
		var post = $scope.feed[i]
		post.ratings.expert.likes = numeral(post.ratings.expert.likes).format('0a').toUpperCase()
		post.ratings.expert.dislikes = numeral(post.ratings.expert.dislikes).format('0a').toUpperCase()
		post.ratings.expert.shares = numeral(post.ratings.expert.shares).format('0a').toUpperCase()
		post.ratings.journalist.likes = numeral(post.ratings.journalist.likes).format('0a').toUpperCase()
		post.ratings.journalist.dislikes = numeral(post.ratings.journalist.dislikes).format('0a').toUpperCase()
		post.ratings.journalist.shares = numeral(post.ratings.journalist.shares).format('0a').toUpperCase()
		post.ratings.visitor.likes = numeral(post.ratings.visitor.likes).format('0a').toUpperCase()
		post.ratings.visitor.dislikes = numeral(post.ratings.visitor.dislikes).format('0a').toUpperCase()
		post.ratings.visitor.shares = numeral(post.ratings.visitor.shares).format('0a').toUpperCase()

		$scope.feed[i] = post
	}

	console.log($scope.feed[0])
})