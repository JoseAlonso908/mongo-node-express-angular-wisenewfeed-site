module.exports = {
	ADMIN_EMAILS: ['angela170990@gmail.com', 'wnfsocial@gmail.com'],
	FACEBOOK_SECRET: 'b0f9e9d9ebaecb3d79e3f2f4c31305b9',
	LINKEDIN_SECRET: 'iyX2DFMPitSmuHIa',
	TWITTER_KEY: 'vWvoIDn4bHVp4TbBg4PX5X8Ir',
	TWITTER_SECRET: 'FVKbagnUXxEtmuFqys7ofkWkZh0WjYKeMzA5nf9bAlRKFrSm75',
	TWITTER_TOKEN_KEY: '141251008-ZNMPm7k7xvU7h42yPdBWm25BC79VspgtZr0EEpHG',
	TWITTER_TOKEN_SECRET: 'HeC1LH0fpxleKjPcLMjqyHfnVp6MvihLBOnIhpkvhe5zB',
	TWILIO: {
		TEST: {
			SID: 'AC8009e363eceb3634a9b202fd4e7866cb',
			AUTHTOKEN: 'a88e2420bc2431ed3e954ffe4095a1b6',
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
}