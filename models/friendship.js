const async = require('async')

var Model = function (mongoose) {
    var schema = new mongoose.Schema({
        ObjectId: mongoose.Schema.ObjectId,
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
        },
        friend: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
        },
        accepted: {
            type: mongoose.Schema.Types.Boolean,
            default: false
        },
        type: {
            type: String,
            default: 'Friend',
        },
        createdAt: {type: Date, default: Date.now}
    })

    var Model = mongoose.model('friendship', schema);

    return {
        add: (friend, user, type, callback) => {
            friend = MOI(friend)
            user = MOI(user)

            if (friend.toString() == user.toString()) {
                return callback()
            }

            Model.findOne({
                $or: [
                    {
                        $and: [
                            {'user': user},
                            {'friend': friend}
                        ]
                    },
                    {
                        $and: [
                            {'user': friend},
                            {'friend': user}
                        ]
                    }
                ]
            }).lean().exec((err, existingFriendship) => {
                if (existingFriendship || err) callback(err)
                else {
                    let friendship = new Model()
                    Object.assign(friendship, {
                        friend, user, type
                    })
                    friendship.save(callback)
                }
            })
        },

        unfriend: (friend, user, callback) => {
            if (typeof friend !== 'object') friend = mongoose.Types.ObjectId(friend)
            if (typeof user !== 'object') user = mongoose.Types.ObjectId(user)
            // Logical Problems available  with condition
            Model.remove({
                $or: [
                    {
                        $and: [
                            {'user': user},
                            {'friend': friend}
                        ]
                    },
                    {
                        $and: [
                            {'user': friend},
                            {'friend': user}
                        ]
                    }
                ]
            }, callback)
        },
        accept: (_id, ownerID, callback) => {
            if (typeof ownerID !== 'object') ownerID = mongoose.Types.ObjectId(ownerID)
            Model.findOneAndUpdate({_id, friend: ownerID}, {accepted: true}, callback)
        },
        remove: (_id, executorID, callback) => {
            if (typeof executorID !== 'object') executorID = mongoose.Types.ObjectId(executorID)
            // It should be available to remove request if you create it or if you are request target user
            Model.findOneAndRemove({
                _id,
                $or: [
                    {friend: executorID},
                    {user: executorID}
                ]
            }, callback)
        },
        isFriend: (friend, user, callback) => {
            friend = MOI(friend)
            user = MOI(user)

            Model.findOne({
                $or: [
                    {
                        $and: [
                            {'user': user},
                            {'friend': friend}
                        ]
                    },
                    {
                        $and: [
                            {'user': friend},
                            {'friend': user}
                        ]
                    }
                ]
            }).lean().exec((err, friendship) => {
                callback(err, {
                    requested: !!friendship,
                    accepted: friendship ? friendship.accepted : false,
                    isInitiator: (friendship && friendship.user.toString() === user.toString()),
                    requestID: friendship ? friendship._id : null,
                    type: friendship ? friendship.type : 'Friend',
                })
            })
        },
        pending: (userID, skip, limit, callback) => {
            const friend = MOI(userID)
            let query = Model.find({friend, accepted: false}).populate('user').lean().sort({createdAt: 'asc'})
            if (skip) query.skip(Number(skip))
            if (limit) query.skip(Number(limit))
            query.exec(callback)
        },
        friends: (user, callback) => {
            user = MOI(user)
            Model.find({
                $and: [
                    {$or: [{user}, {friend: user}]},
                    {accepted: true}
                ]
            }).lean().exec((err, friendships) => {
                if (err) return callback(err)

                let friendsIds = friendships.map((friendship) => {
                    if (friendship.user == user.toString()) {
                        return friendship.friend
                    } else {
                        return friendship.user
                    }
                })

                callback(err, friendsIds)
            })
        },
        friendsDetailedPaged: (user, skip, limit, filters, callback) => {
            user = MOI(user)

            skip = Number(skip || 0)
            limit = Number(limit || 1000)

            let prefixFilters = (prefix, filters) => {
                let result = {}

                for (let param in filters) {
                    let value = filters[param]
                    if (value) result[prefix + '.' + param] = value
                }

                return result
            }

            // filters['_id'] = user

            let userMatchingQuery = prefixFilters('user', filters),
                friendMatchingQuery = prefixFilters('friend', filters)

            userMatchingQuery['friend._id'] = user
            friendMatchingQuery['user._id'] = user

            let aggregationOptions = [
                {
                    $match: {
                        accepted: true
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'user',
                        foreignField: '_id',
                        as: 'user',
                    },
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'friend',
                        foreignField: '_id',
                        as: 'friend',
                    },
                },
                {
                    $match: {
                        $or: [userMatchingQuery, friendMatchingQuery]
                    }
                },
                {
                    $unwind: "$user",
                },
                {
                    $unwind: "$friend",
                },
                {$skip: skip},
                {$limit: limit},
            ]

            Model.aggregate(aggregationOptions).exec((err, friendships) => {
                if (err) return callback(err)

                let friendsIds = friendships.map((friendship) => {
                    if (friendship.user._id.toString() == user.toString()) {
                        return friendship.friend
                    } else {
                        return friendship.user
                    }
                })

                callback(err, friendsIds)
            })
        },
    }
}

module.exports = Model
