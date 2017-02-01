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
        createdAt: {type: Date, default: Date.now}
    })

    var Model = mongoose.model('friendship', schema);

    return {
        add: (friend, user, callback) => {
            if (typeof friend !== 'object') friend = mongoose.Types.ObjectId(friend)
            if (typeof user !== 'object') user = mongoose.Types.ObjectId(user)

            if (friend.toString() == user.toString()) {
                return callback()
            }

            Model.findOne({friend, user}).lean().exec((err, existingFriendship) => {
                console.log(existingFriendship);
                if (existingFriendship || err) callback(err)
                else {
                    let friendship = new Model()
                    Object.assign(friendship, {
                        friend, user
                    })
                    friendship.save(callback)
                }
            })
        },

        unfriend: (friend, user, callback) => {
            if (typeof friend !== 'object') friend = mongoose.Types.ObjectId(friend)
            if (typeof user !== 'object') user = mongoose.Types.ObjectId(user)

            Model.remove({friend, user}, callback)
        },
        accept: (_id, ownerID, callback) => {
            if (typeof ownerID !== 'object') ownerID = mongoose.Types.ObjectId(ownerID)
            Model.findOneAndUpdate({_id, friend: ownerID}, {accepted:true}, callback)
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
                callback(err, {friendship: !!friendship, accepted: friendship ? friendship.accepted : null})
            })
        },
        pending: (userID, skip, limit, callback) => {
            const friend = MOI(userID)
            let query = Model.find({friend, accepted: false}).populate('user').lean().sort({createdAt: 'asc'})
            if (skip) query.skip(Number(skip))
            if (limit) query.skip(Number(limit))
            query.exec(callback)
        }
    }
}

module.exports = Model