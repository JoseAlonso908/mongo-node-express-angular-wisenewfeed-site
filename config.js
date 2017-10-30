module.exports = {
	ADMIN_EMAILS: ['lhoang295@gmail.com', 'nguyenchithanh10101992@gmail.com'],
	FACEBOOK_SECRET: 'b0f9e9d9ebaecb3d79e3f2f4c31305b9',
	LINKEDIN_SECRET: 'iyX2DFMPitSmuHIa',
	TWITTER_KEY: 'vWvoIDn4bHVp4TbBg4PX5X8Ir',
	TWITTER_SECRET: 'FVKbagnUXxEtmuFqys7ofkWkZh0WjYKeMzA5nf9bAlRKFrSm75',
	TWITTER_TOKEN_KEY: '141251008-ZNMPm7k7xvU7h42yPdBWm25BC79VspgtZr0EEpHG',
	TWITTER_TOKEN_SECRET: 'HeC1LH0fpxleKjPcLMjqyHfnVp6MvihLBOnIhpkvhe5zB',
	TWILIO: {
		TEST: {
			SID: 'AC8c1f974cf7bafe24a95450d30ff4693b',
			AUTHTOKEN: '6f6f4df6d46ec793caf9aff886e57c46',
		}
	},
	MAILGUN: {
		APIKEY: 'key-20875aee9b1ccb3a8dc0bf2c906eafb5',
		SANDBOX_DOMAIN: 'sandbox2acf9e50194e46c9b47c1b82106a334f.mailgun.org',
	},
	MONGO: {
		'local': {
			DSN: 'mongodb://localhost/expertreaction'
		},
		'development': {
			DSN: 'mongodb://lp:w2eVt1puhb@wlab.tech/expertreaction'
		}
	},
	EXP_REWARDS: {
		POST: {
			create: 2,
			like: 1,
			share: 1,
			react: 2,
		},
		COMMENT: {
			create: 1,
			like: 1,
		},
		FOLLOW: {
			following: 1,
			follower: 3,
		},
	},
	WISEPOINT_REWARDS: {
		POST_CREATE: [
			{ MIN_COUNT: 0, POINTS: 0 },
			{ MIN_COUNT: 1, POINTS: 2 },
			{ MIN_COUNT: 3, POINTS: 3 },
			{ MIN_COUNT: 6, POINTS: 4 },
			{ MIN_COUNT: 10, POINTS: 5 },
		],
		ARTICLE_CREATE: [
			{ MIN_COUNT: 0, POINTS: 0 },
			{ MIN_COUNT: 1, POINTS: 3 },
			{ MIN_COUNT: 3, POINTS: 4 },
			{ MIN_COUNT: 5, POINTS: 5 },
		],
		COMMENT_CREATE: [
			{ MIN_COUNT: 0, POINTS: 0 },
			{ MIN_COUNT: 2, POINTS: 2 },
			{ MIN_COUNT: 10, POINTS: 3 },
			{ MIN_COUNT: 20, POINTS: 4 },
			{ MIN_COUNT: 30, POINTS: 5 },
		],
		RECOMMEND: [
			{ MIN_COUNT: 0, POINTS: 0 },
			{ MIN_COUNT: 50, POINTS: 1 },
			{ MIN_COUNT: 100, POINTS: 2 },
			{ MIN_COUNT: 300, POINTS: 3 },
			{ MIN_COUNT: 600, POINTS: 4 },
			{ MIN_COUNT: 1000, POINTS: 5 },
		],
		SHARE: [
			{ MIN_COUNT: 0, POINTS: 0 },
			{ MIN_COUNT: 20, POINTS: 1 },
			{ MIN_COUNT: 50, POINTS: 2 },
			{ MIN_COUNT: 100, POINTS: 3 },
			{ MIN_COUNT: 300, POINTS: 4 },
			{ MIN_COUNT: 500, POINTS: 5 },
		],
		FOLLOWER: [
			{ MIN_COUNT: 0, POINTS: 0 },
			{ MIN_COUNT: 1, POINTS: 1 },
			{ MIN_COUNT: 10, POINTS: 2 },
			{ MIN_COUNT: 30, POINTS: 3 },
			{ MIN_COUNT: 60, POINTS: 4 },
			{ MIN_COUNT: 100, POINTS: 5 },
		],
		NEGATIVE: {
			NO_POST: 5,
			NO_ARTICLE: 5,
			NO_COMMENT: 5,
			NO_RECOMMEND: 5,
			NO_SHARE: 5,
		},
		NEGATE_MIN_POINTS: 0,
	}
}
