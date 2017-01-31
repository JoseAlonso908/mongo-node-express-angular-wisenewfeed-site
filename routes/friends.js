const express = require('express'),
    path = require('path'),
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
    models.Friend.isFriend(req.user._id, id, (err, isFriend) => {
        if (err) res.status(400).send(err)
        else res.send({isFriend})
    })
})

router.post('/add', (req, res) => {
    let {id, phone} = req.body
    async.waterfall([
        cb => {
            models.User.findOne({$and: [{_id: id}, {phone}]}, (err, result) => {
                if (!result) err = new Error('Wrong phone number provided')
                cb(err, result)
            })
        },
        (result, cb) => {
            models.Friend.add(id, req.user._id, (err, result) => {
                cb(err)
            })
        }
    ], (err, result) => {
        if (err) return res.status(400).send(err)
        res.send({isFriend: true})
    })
})

router.post('/remove', (req, res) => {
    let {id} = req.body
    models.Friend.unfriend(id, req.user._id, (err, result) => {
        console.log(result);
        if (err) return res.status(400).send(err)
        res.send({isFriend: false})
    })
})

module.exports = router