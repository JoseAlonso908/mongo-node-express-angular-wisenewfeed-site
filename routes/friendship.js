const express = require('express'),
    async = require('async'),
    config = require('./../config')

let router = express.Router()

router.use((req, res, next) => {
    if (!req.headers.authorization) {
        res.status(400).send({message: 'Invalid token'})
    } else {
        req.access_token = req.headers.authorization.split(' ')[1]

        models.Token.getUserByToken(req.access_token, (err, user) => {
            req.user = user
            next()
        })
    }
})

router.get('/isFriend', (req, res) => {
    let {id} = req.query
    console.log(req.query);
    models.Friendship.isFriend(id, req.user._id, (err, status) => {
        if (err) res.status(400).send(err)
        else res.send(status)
    })
})

router.post('/add', (req, res) => {
    let {id, phone, type} = req.body
    async.waterfall([
        cb => {
            models.User.findOne({$and: [{_id: id}, {phone}]}, (err, result) => {
                if (!result) err = new Error('Wrong phone number provided')
                cb(err, result)
            })
        },
        (result, cb) => {
            models.Friendship.add(id, req.user._id, type, (err, result) => {
                cb(err, result)
            })
        },
        (result, cb) => {
            models.Notification.create(id, req.user._id, null, null, 'friendshipnew', (err, res) => {
                console.log(err);
                console.log(res);
                cb(null)
            })
        }
    ], (err, result) => {
        if (err) return res.status(400).send(err)
        res.send({requested: true, accepted: false, isInitiator: true})
    })
})

router.post('/remove', (req, res) => {
    let {id} = req.body
    models.Friendship.unfriend(id, req.user._id, (err, result) => {
        if (err) return res.status(400).send(err)
        res.send({requested: false, accepted: false})
    })
})

router.post('/accept', (req, res) => {
    let {id} = req.body
    models.Friendship.accept(id, req.user._id, (err, result) => {
        if (err) return res.status(400).send(err)
        res.send({requested: true, accepted: true})
    })
})

router.post('/decline', (req, res) => {
    let {id} = req.body
    models.Friendship.remove(id, req.user._id, (err, result) => {
        if (err) return res.status(400).send(err)
        res.send({ok: true})
    })
})

router.get('/pending', (req, res) => {
    let {skip, limit} = req.query
    models.Friendship.pending(req.user._id, skip, limit, (err, result) => {
        if (err) return res.status(400).send(err)
        res.send(result)
    })
})

router.get('/list', (req, res) => {
    let {skip, limit, country, city, gender, id} = req.query
    let filters = {country, city, gender}
    if (!id) id = req.user._id

    models.Friendship.friendsDetailedPaged(id, skip, limit, filters, (err, result) => {
        if (err) return res.status(400).send(err)
        res.send(result)
    })
})

module.exports = router
