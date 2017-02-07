const express = require('express'),
    path = require('path'),
    async = require('async'),
    metascraper = require('metascraper')

let router = express.Router()

router.get('/test', (req, res) => {
    var url = 'https://medium.freecodecamp.com/an-animated-guide-to-flexbox-d280cf6afc35#.t83ysx75u';
    metascraper.scrapeUrl(url).then((metadata) => {
        console.log(metadata)
        res.json(metadata)
    })
})

module.exports = router