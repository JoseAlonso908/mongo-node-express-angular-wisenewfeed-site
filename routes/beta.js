const express = require('express'),
    mailcomposer = require('mailcomposer'),
    nunjucks = require('nunjucks'),
    uuid = require('node-uuid'),
    multer = require('multer'),
    pdf = require('html-pdf'),
    async = require('async'),
    path = require('path'),
    fs = require('fs'),
    validator = require('validator')

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

    console.log(form)

    // Turn form to model scheme
    let user = {
        name: form.name,
        intro: form.info,
        email: form.email,
        phone: form.phone,
        position: form.title,
        company: form.company,
        role: form.role,
        title: form.title,
        contact: {
            email: form.email,
            phone: form.phone,
            linkedin: form.linkedin,
            fb: form.facebook,
        },
        certificates: form.certificates.map(c => {
            return {
                filename: c.title,
                filepath: c.file
            }
        }),
        downloads: form.additional.map(c => {
            return {
                filename: c.title,
                filepath: c.file
            }
        }),
        experience: form.experience.map(e => {
            return {
                time: e.from + ' - ' + e.to,
                place: e.place,
            }
        })
    }

    async.waterfall([
        (next) => {
            if (!validator.isEmail(form.email)) next({message: 'Invalid email'})
            else next()
        },
        (next) => {
            models.User.findByEmail(form.email, (err, user) => {
                if (user) next({message: 'User with this email aready exist'})
                else next()
            })
        },
        (next) => {
            models.User.findByPhone(form.phone, (err, user) => {
                if (user) next({message: 'User with this phone aready exist'})
                else next()
            })
        },
        (next) => {
            models.User.createUser(user, (err, user) => {
                next(err, user)
            })
        },
        (user, next) => {
            pdf.create(htmlContent, {format: 'Letter'}).toFile('./temp/' + pdfName, (err, resultPDF) => {
                if (err) return next(err);
                next(null, user, resultPDF)
            })
        },
        (user, resultPDF, next) => {
            let approveLink = `${req.protocol}://${req.headers.host}/user/approve?id=${user.id}`,
                declineLink = `${req.protocol}://${req.headers.host}/user/decline?id=${user.id}`


            var mail = mailcomposer({
                from: `service@${config.MAILGUN.SANDBOX_DOMAIN}`,
                to: config.ADMIN_EMAILS.join(', '),
                subject: `ER: New signup for beta request`,
                text: `New signup request from ${form.name} ${form.email}
                \nApprove ${approveLink}
                \nDecline ${declineLink}`,
                html: `<strong>New signup request from ${form.name} ${form.email}</strong><br>
                <a href="${approveLink}">Approve</a><br>
                <a href="${declineLink}">Decline</a>`,
                attachments: [{path: resultPDF.filename}]
            })

            next(null, mail)
        },
        (mail, next) => {
            mail.build(next)
        },
        (msg, next) => {
            mailgun.sendRaw(`service@${config.MAILGUN.SANDBOX_DOMAIN}`, config.ADMIN_EMAILS, msg.toString('ascii'), next)
        }
    ], (err) => {
        if (err) res.status(400).send(err)
        else res.json({ok: true})
    })
})

module.exports = router
