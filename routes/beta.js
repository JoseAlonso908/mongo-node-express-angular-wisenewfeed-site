const express = require('express'),
    mailcomposer = require('mailcomposer'),
    nunjucks = require('nunjucks'),
    uuid = require('node-uuid'),
    multer = require('multer'),
    pdf = require('html-pdf'),
    async = require('async'),
    path = require('path'),
    fs = require('fs')

const config = require('./../config')

let tempUploads = multer({
    dest: './temp/',
    limits: {
        fileSize: 5 * 1024 * 1024
    }
})

let router = express.Router()

router.use(function (err, req, res, next) {
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).send({message: `Can't upload file: ${err.message}`})
    } else {
        next()
    }
})

router.post('/addcertificate', tempUploads.single('file'), (req, res) => {
    let extension = req.file.originalname.split('.').slice(-1),
        tempPath = req.file.path,
        newFilename = req.file.filename + '.' + extension

    const uploadedPath = path.join(__root, 'uploads', 'beta', 'certificates', newFilename)
    const relativePath = path.join('uploads', 'beta', 'certificates', newFilename)
    fs.renameSync(path.join(__root, tempPath), uploadedPath)
    res.send({ok: true, file: relativePath})
})

router.post('/adddownload', tempUploads.single('file'), (req, res) => {
    let extension = req.file.originalname.split('.').slice(-1),
        tempPath = req.file.path,
        newFilename = req.file.filename + '.' + extension
    const uploadedPath = path.join(__root, 'uploads', 'beta', 'downloads', newFilename)
    const relativePath = path.join('uploads', 'beta', 'downloads', newFilename)
    fs.renameSync(path.join(__root, tempPath), uploadedPath)
    res.send({ok: true, file: relativePath})
})

//TODO: THIS SHIT IS DANGEROUS
// router.post('/removecertificate', tempUploads.single('file'), (req, res) => {
//     let {filename} = req.body
//
//     if (filename) {
//         try {
//             fs.unlinkSync(path.join(__root, filename))
//         } catch (e) {
//             console.log(`Can't unlink file`)
//             console.log(e)
//         }
//         res.send({ok: true})
//     } else {
//         res.status(400).send({message: 'Certificate not found'})
//     }
// })

//TODO: THIS IS DANGEROUS
// router.post('/removedownload', (req, res) => {
//
//     let {filename} = req.body
//     if (filename) {
//         try {
//             fs.unlinkSync(path.join(__root, filename))
//         } catch (e) {
//             console.log(`Can't unlink file`)
//             console.log(e)
//         }
//         res.send({ok: true})
//     } else {
//         res.status(400).send({message: 'Download not found'})
//     }
// })

router.post('/signup', (req, res) => {
    let {form} = req.body
    console.log(form);
    let certificates = form.certificates.map(cert => {
        let file = ''
        if (cert.file) {
            file = `${req.protocol}://${req.headers.host}/${cert.file}`
        }
        return {title: cert.title, file}
    })
    let additional = form.additional.map(item => {
        let file = ''
        if (item.file) {
            file = `${req.protocol}://${req.headers.host}/${item.file}`
        }
        return {title: item.title, file}
    })
    form.certificates = certificates
    form.additional = additional
    let htmlContent = nunjucks.render(__dirname + '/../templates/signupBeta.html', {form})
    const pdfName = uuid.v4() + '.pdf';
    pdf.create(htmlContent, {format: 'Letter'}).toFile('./temp/' + pdfName, (err, resultPDF) => {
        if (err) return console.log(err);

        var mail = mailcomposer({
            from: `service@${config.MAILGUN.SANDBOX_DOMAIN}`,
            to: config.ADMIN_EMAILS.join(', '),
            subject: `ER: New signup for beta request`,
            text: `New signup request from ${form.name} ${form.email}`,
            html: `<strong>New signup request from ${form.name} ${form.email}</strong>`,
            attachments: [{path: resultPDF.filename}]
        })

        mail.build((err, msg) => {
            mailgun.sendRaw(`service@${config.MAILGUN.SANDBOX_DOMAIN}`, config.ADMIN_EMAILS, msg.toString('ascii'), err => {
                if (err) console.log(err)
                res.json({ok: true})
            })
        })
    });

})

module.exports = router
