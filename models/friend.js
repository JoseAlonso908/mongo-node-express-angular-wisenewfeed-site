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
        createdAt: {type: Date, default: Date.now}
    })

    var Model = mongoose.model('friend', schema);

    return {
        add: (friend, user, callback) => {
            if (typeof friend !== 'object') friend = mongoose.Types.ObjectId(friend)
            if (typeof user !== 'object') user = mongoose.Types.ObjectId(user)

            if (friend.toString() == user.toString()) {
                return callback()
            }

            Model.findOne({friend, user}).lean().exec((err, existingFriendship) => {
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

        isFriend: (friend, user, callback) => {
            if (typeof friend !== 'object') friend = mongoose.Types.ObjectId(friend)
            if (typeof user !== 'object') user = mongoose.Types.ObjectId(user)

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
            }).lean().exec((err, follow) => {
                callback(err, !!follow)
            })
        }
    }
}

module.exports = Model