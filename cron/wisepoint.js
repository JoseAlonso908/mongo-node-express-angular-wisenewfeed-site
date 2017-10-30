process.on('unhandledRejection', (reason, promise) => {
	console.log(reason)
	console.log(promise)
})

const config = require('./../config')
const env = 'development'

const path = require('path')

global.__root = path.join(__dirname, '..')
var modelWrapper = require('./../model')(config.MONGO[env].DSN, __root)
global.models = modelWrapper.models()

var WisePoints = (() => {
	let zeroArticleAction = (user) => {
		models.Article.hasArticlesInLastWeek(user._id, (err, hasArticles) => {
			if (!hasArticles) {
				models.ExperienceLog.award(user._id, -(config.WISEPOINT_REWARDS.NEGATIVE.NO_ARTICLE), null, null, 'article', () => {
					console.log('User ' + user._id + ' has no articles in last week. Negated wise points!');
				});
			}
		});
	};
	let zeroPostAction = (user) => {
		models.Article.hasPostsInLastWeek(user._id, (err, hasPosts) => {
			if (!hasPosts) {
				models.ExperienceLog.award(user._id, -(config.WISEPOINT_REWARDS.NEGATIVE.NO_POST), null, null, 'post', () => {
					console.log('User ' + user._id + ' has no posts in last week. Negated wise points!');
				});
			}
		});
	};
	let zeroCommentAction = (user) => {
		models.Comment.hasCommentsInLastWeek(user._id, (err, hasComments) => {
			if (!hasComments) {
				models.ExperienceLog.award(user._id, -(config.WISEPOINT_REWARDS.NEGATIVE.NO_COMMENT), null, null, 'comment', () => {
					console.log('User ' + user._id + ' has no comments in last week. Negated wise points!');
				});
			}
		});
	};
	let zeroRecommendAction = (user) => {
		models.PostReaction.hasPostReactionsInLastWeek(user._id, 'smart', (err, hasReactions) => {
			if (!hasReactions) {
				models.ExperienceLog.award(user._id, -(config.WISEPOINT_REWARDS.NEGATIVE.NO_RECOMMEND), null, null, 'smart', () => {
					console.log('User ' + user._id + ' has no recommends in last week. Negated wise points!');
				});
			}
		});
	};
	let zeroShareAction = (user) => {
		models.PostReaction.hasPostReactionsInLastWeek(user._id, 'share', (err, hasReactions) => {
			if (!hasReactions) {
				models.ExperienceLog.award(user._id, -(config.WISEPOINT_REWARDS.NEGATIVE.NO_SHARE), null, null, 'share', () => {
					console.log('User ' + user._id + ' has no shares in last week. Negated wise points!');
				});
			}
		});
	};
	return {
		startProcess: () => {
			models.User.findByCronScheduledToday((err, users) => {
				users.forEach((user) => {
					console.log('Processing user - ' + user._id);
					zeroArticleAction(user);
					zeroPostAction(user);
					zeroCommentAction(user);
					zeroRecommendAction(user);
					zeroShareAction(user);
					let date = user.nextXpCronDate || new Date();
					user.nextXpCronDate = new Date(date.getTime() + (7 * 24 * 60 * 60 * 1000));
					models.User.update(user._id, user, () => {
						console.log('Next schedule updated for ' + user._id);
					});
				});
			});
		},
	}
})();

module.exports = WisePoints;
