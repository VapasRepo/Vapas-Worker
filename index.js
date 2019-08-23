const express = require('express')
const dotenv = require('dotenv')
const Sentry = require('@sentry/node')
const MongoClient = require('mongodb').MongoClient
const assert = require('assert')
const compression = require('compression')
const expressMongoDb = require('express-mongo-db')
const moment = require('moment')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const btoa = require('btoa')
const atob = require('atob')
const pino = require('pino')()
const pinoExpress = require('express-pino-logger')()
const expressSession = require('cookie-session')
const util = require('util')
const querystring = require('querystring')
const jwtCert = fs.readFileSync(path.resolve(__dirname, './vapas.cer'))
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt
const jwt = require('jsonwebtoken')

dotenv.config()

// Passport.js

const Auth0Strategy = require('passport-auth0')
const passport = require('passport')

const session = {
  secret: crypto.randomBytes(8).toString(),
  cookie: {},
  resave: false,
  saveUninitialized: true
}

session.cookie.secure = true

var strategy = new Auth0Strategy({
  domain: process.env.auth0URL,
  clientID: process.env.auth0clientID,
  clientSecret: process.env.auth0clientSecret,
  callbackURL: process.env.URL + '/payment/auth0callback'
},
function (accessToken, refreshToken, extraParams, profile, done) {
  const token = extraParams.id_token
  return done(null, profile, token)
})

var opts = {}
opts.jwtFromRequest = ExtractJwt.fromBodyField('token')
opts.secretOrKey = jwtCert
passport.use(new JwtStrategy(opts, function (jwtPayload, done) {
  return done(null, jwtPayload)
}))

// Crypto setup

const cryptoAlgorithm = 'aes-256-cbc'
// FIXME: God this is a bad idea, change this
const workerMasterKey = crypto.randomBytes(32)
const workerMasterIV = crypto.randomBytes(16)

const app = express()

const port = 1406

// MongoDB Setup

const dbURL = process.env.dbURL
const dbName = 'vapasContent'
const dbClient = new MongoClient(dbURL)

// Load express middleware

app.use(expressMongoDb(dbURL))

app.use(express.json())

app.use(pinoExpress)

app.use(bodyParser.urlencoded({ extended: true }))

app.use(express.urlencoded({ extended: true }))

app.use(expressSession(session))

app.use(cookieParser())

passport.use(strategy)

app.use(passport.initialize())

app.use(passport.session())

passport.serializeUser((user, done) => {
  done(null, user)
})

passport.deserializeUser((user, done) => {
  done(null, user)
})

// Sentry setup

Sentry.init({ dsn: process.env.SENTRYDSN })

app.use(Sentry.Handlers.requestHandler())

const findDocuments = function (db, collectionName, callback) {
  var dbObject = db.db(dbName)
  const collection = dbObject.collection(collectionName)
  collection.find({}).toArray(function (err, docs) {
    assert.strictEqual(err, null)
    callback(docs)
  })
}

// Express Routing

app.use('/', express.static(path.join(__dirname, 'webDepictions')))

// For some odd reason, older cyida versions navigate with (url)/./(path)

/**
app.get('/./*', function mainHandler (req, res) {
  res.set('location', req.originalUrl.substring(2))
  pino.info(req.originalUrl.substring(2))
  res.status(308).send()
})
*/

app.get('/./Release', function mainHandler (req, res) {
  res.write('Origin: Please switch to Zebra.\n')
  res.write('Label: Please switch to Zebra.\n')
  res.write('Suite: "stable"\n')
  res.write('Version: "1.0"\n')
  res.write('Codename: "ios"\n')
  res.write('Architectures: "iphoneos-arm"\n')
  res.write('Components: "Components"\n')
  res.write('Description: "Please switch to Zebra."')
  res.end()
})

app.get('/./Packages', function mainHandler (req, res) {
  res.end()
})

// Core repo infomation

app.get('/sileo-featured.json', function mainHandler (req, res) {
  findDocuments(req.db, 'vapasInfomation', function (docs) {
    res.send(docs[0].featured)
    dbClient.close()
    res.end()
  })
})

app.get('/Packages*', compression(), function mainHandler (req, res) {
  findDocuments(req.db, 'vapasContent', function (docs) {
    var x, i
    for (x in docs[0].Packages) {
      for (i in docs[0].Packages[x]) {
        res.write(i + ': ' + docs[0].Packages[x][i] + '\n')
      }
      res.write('\n')
    }
    dbClient.close()
    res.end()
  })
})

app.get('/Release', function mainHandler (req, res) {
  findDocuments(req.db, 'vapasInfomation', function (docs) {
    var i
    for (i in docs[1].Release) {
      res.write(i + ': ' + docs[1].Release[i] + '\n')
    }
    dbClient.close()
    res.end()
  })
})

app.get('/CydiaIcon.png', function mainHandler (req, res) {
  res.sendFile('./assets/cyidaIcon.png', { root: './' })
})

app.get('/footerIcon.png', function mainHandler (req, res) {
  res.sendFile('./assets/footerIcon.png', { root: './' })
})

// Open package manager when someone clicks "Add to package manager"

app.get('/cyidaRedirect', function mainHandler (req, res) {
  res.set('location', 'cydia://url/https://cydia.saurik.com/api/share#?source=' +
    process.env.URL)
  res.status(302).send()
  res.end()
})

// Legacy Depictions

app.get('/depiction/:packageID', function mainHandler (req, res) {
})

// Native Depictions
app.get('/sileodepiction/:packageID', function mainHandler (req, res) {
  findDocuments(req.db, 'vapasContent', function (docs) {
    var screenshots = ''
    var knownIssues = ''
    var changeLog = ''
    var packageData = docs[1].packageData[req.params.packageID]
    var packagePrice = packageData.price.toString()
    if (packagePrice === '0') {
      packagePrice = 'Free'
    } else {
      packagePrice = '$' + packagePrice
    }
    var i
    for (i in packageData.knownIssues) {
      knownIssues += '* ' + packageData.knownIssues[i] + '\\n'
    }
    i = 0
    for (i in packageData.screenshots) {
      if (i.toString() === (packageData.screenshots.length - 1).toString()) {
        screenshots += `{ "accessibilityText": "Screenshot", "url": "` + packageData.screenshots[i] + `", 
        "fullSizeURL": "` + packageData.screenshots[i] + `" }`
      } else {
        screenshots += `{ "accessibilityText": "Screenshot", "url": "` + packageData.screenshots[i] + `", 
        "fullSizeURL": "` + packageData.screenshots[i] + `" },`
      }
    }
    i = 0
    for (i in packageData.currentVersion.changeLog) {
      if (i.toString() === (packageData.currentVersion.changeLog.length - 1).toString()) {
        changeLog += `* ` + packageData.currentVersion.changeLog[i]
      } else {
        changeLog += `* ` + packageData.currentVersion.changeLog[i] + `\n`
      }
    }
    var sileoData = `{ "minVersion":"0.1", "headerImage":"` + packageData.headerImage + `", "tintColor": "` + packageData.tint + `", "tabs": [ { "tabname": "Details", "views": [ { "title": "` + packageData.shortDescription + `", "useBoldText": true, "useBottomMargin": false, "class": "DepictionSubheaderView" }, { "markdown": "` + packageData.longDescription + `", "useSpacing": true, "class": "DepictionMarkdownView" }, { "class": "DepictionSeparatorView" }, { "title": "Screenshots", "class": "DepictionHeaderView" }, { "itemCornerRadius": 6, "itemSize": "{160, 275.41333333333336}", "screenshots": [ ` + screenshots + ` ], "ipad": { "itemCornerRadius": 9, "itemSize": "{320, 550.8266666666667}", "screenshots": [ ` + screenshots + ` ], "class": "DepictionScreenshotView" }, "class": "DepictionScreenshotsView" }, { "class": "DepictionSeparatorView" }, { "title": "Known Issues", "class": "DepictionHeaderView" }, { "markdown": "` + knownIssues + `", "useSpacing": true, "class": "DepictionMarkdownView" }, { "class": "DepictionSeparatorView" }, { "title": "Package Information", "class": "DepictionHeaderView" }, { "title": "Version", "text": "` + packageData.currentVersion.versionNumber + `", "class": "DepictionTableTextView" }, { "title": "Released", "text": "` + moment(packageData.currentVersion.dateReleased).format('MMMM Do YYYY') + `", "class": "DepictionTableTextView" }, { "title": "Price", "text": "` + packagePrice + `", "class": "DepictionTableTextView" }, { "class": "DepictionSeparatorView" }, { "title": "Developer Infomation", "class": "DepictionHeaderView" },{ "class": "DepictionStackView" }, { "title": "Developer", "text": "` + packageData.developer + `", "class": "DepictionTableTextView" }, { "title": "Support (` + packageData.supportLink.name + `)", "action": "` + packageData.supportLink.url + `", "class": "DepictionTableButtonView" }, { "class": "DepictionSeparatorView" }, { "spacing": 10, "class": "DepictionSpacerView" }, {"URL": "` + process.env.URL + `/footerIcon.png", "width": 125, "height": 67.5, "cornerRadius": 0, "alignment": 1, "class": "DepictionImageView" } ], "class": "DepictionStackView" }, { "tabname": "Changelog", "views": [{ "title": "Version ` + packageData.currentVersion.versionNumber + `", "useBoldText": true, "useBottomMargin": true, "class": "DepictionSubheaderView" }, { "markdown": "` + changeLog + `", "useSpacing": false, "class": "DepictionMarkdownView" } ], "class": "DepictionStackView" } ], "class": "DepictionTabView" }`
    res.send(JSON.parse(sileoData))
    dbClient.close()
    res.end()
  })
})

// Payment handler

app.get('/payment_endpoint', function mainHandler (req, res) {
  res.send(process.env.URL + '/payment/')
})

app.get('/payment', function mainHandler (req, res) {
  res.status(200).send()
  res.end()
})

app.get('/payment/info', function mainHandler (req, res) {
  res.send('{"name": "Vapas", "icon": "' + process.env.URL + '/CydiaIcon.png", "description": "Vapas Pay", "authentication_banner": { "message": "Sign into Vapas to purchase and download paid packages.", "button": "Sign in" } }')
})

// Send back that we are authed, add actual code later

app.get('/payment/authenticate', passport.authenticate('auth0', { scope: 'profile openid' }), (req, res) => {
  res.redirect('/')
})

app.get('/payment/auth0callback', (req, res, next) => {
  passport.authenticate('auth0', function (err, user, info) {
    if (err) { return next(err) }
    if (!user) { return res.sendStatus((403)) }
    req.logIn(user, function (err) {
      if (err) { return next(err) }
      req.session.timestamp = new Date()
      res.redirect('sileo://authentication_success?token=' + info + '&payment_secret=piss')
    })
  })(req, res, next)
})

app.post('/payment/sign_out', function mainHandler (req, res) {
  req.logOut()
  const logoutURL = new URL(
    util.format('https://%s/logout', process.env.auth0URL)
  )

  const searchString = querystring.stringify({
    client_id: process.env.auth0clientID
  })

  logoutURL.search = searchString

  res.redirect(logoutURL)
  // res.send(JSON.parse('{ "success": true }'))
})

app.post('/payment/user_info', passport.authenticate('jwt', { session: false }), function mainHandler (req, res) {
  findDocuments(req.db, 'vapasUsers', function (docs) {
    let userPackages = ''
    let i = ''
    for (i in docs[0].userData[req.user.sub]) {
      if (i.toString() === (docs[0].userData[req.user.sub].length - 1).toString()) {
        userPackages += '"' + docs[0].userData[req.user.sub][i] + '"'
      } else {
        userPackages += '"' + docs[0].userData[req.user.sub][i] + '", '
      }
    }
    res.send(JSON.parse('{ "items": [ ' + userPackages + ' ], "user": { "name": "' + req.user.nickname + '", "email": "' + req.user.name + '" } }'))
  })
})

app.post('/payment/package/:packageID/info', function mainHandler (req, res) {
  findDocuments(req.db, 'vapasContent', function (content) {
    findDocuments(req.db, 'vapasUsers', function (user) {
      const packageData = content[1].packageData[req.params.packageID]
      let purchased
      if (req.body.token !== undefined) {
        if (packageData.price !== 0) {
          jwt.verify(req.body.token, jwtCert, function (err, decoded) {
            if (err) {
              pino.info(err)
            }
            let i
            for (i in user[0].userData[decoded.sub]) {
              if (user[0].userData[decoded.sub][i] === req.params.packageID) {
                purchased = true
              }
            }
          })
        }
      } else {
        purchased = false
      }
      res.send(JSON.parse(`{ "price": "$` + packageData.price + `", "purchased": ` + purchased + `, "available": true }`))
    })
  })
})

app.post('/payment/package/:packageID/purchase', function mainHandler (req, res) {
  res.send(JSON.parse(`{ "status": "1", "url": "sileo://payment_completed" }`))
})

app.post('/payment/package/:packageID/authorize_download', function mainHandler (req, res) {
  // Key expires after 10 (20 for development) seconds from key creation
  const hashedDataCipher = crypto.createCipheriv(cryptoAlgorithm, Buffer.from(workerMasterKey, 'hex'), Buffer.from(workerMasterIV, 'hex'))
  let hashedData = hashedDataCipher.update(btoa(JSON.stringify(JSON.parse(`{"udid": "` + req.body.udid + `", "packageID": "` + req.params.packageID + `", "packageVersion": "` + req.body.version + `", "expiry": "` + (Date.now() + 20000) + `"}`))), 'base64', 'base64') + hashedDataCipher.final('base64')
  hashedData = hashedData.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')

  res.send(JSON.parse(`{ "url": "` + process.env.URL + `/secure-download/?auth=` + hashedData + `" }`))
})

// Secure download

app.get('/secure-download/', function mainHandler (req, res) {
  if (req.query.auth != null) {
    var authKey = req.query.auth.replace('-', '+').replace('_', '/')
    while (authKey.length % 4) { authKey += '=' }
    const hashedDataDecipher = crypto.createDecipheriv(cryptoAlgorithm, Buffer.from(workerMasterKey, 'hex'), Buffer.from(workerMasterIV, 'hex'))
    let hashedData
    try {
      hashedData = JSON.parse(atob(hashedDataDecipher.update(authKey, 'base64', 'base64') + hashedDataDecipher.final('base64')))
    } catch (err) {
      res.status(403).send()
      res.end()
      pino.warn('Blocked key error')
    }
    if (hashedData.expiry >= Date.now()) {
      res.download(`./debs/` + hashedData.packageID + '_' + hashedData.packageVersion + `_iphoneos-arm.deb`)
    } else {
      res.status(403).send()
      res.end()
      pino.warn('Blocked download attempt from udid ' + hashedData.udid + ' (Link expired)')
    }
  } else {
    res.status(403).send()
    res.end()
  }
})

// Insecure download

app.get('/debs/:packageID', function mainHandler (req, res) {
  if (req.params.packageID !== '') {
    findDocuments(req.db, 'vapasContent', function (docs) {
      const packageID = req.params.packageID.substring(0, req.params.packageID.indexOf('_')).toString()
      if (docs[1].packageData[packageID].price.toString() === '0') {
        const hashedDataCipher = crypto.createCipheriv(cryptoAlgorithm, Buffer.from(workerMasterKey, 'hex'), Buffer.from(workerMasterIV, 'hex'))
        let hashedData = hashedDataCipher.update(btoa(JSON.stringify(JSON.parse(`{ "udid":"4e1243bd22c66e76c2ba9eddc1f91394e57f9f83", "packageID": "` + packageID + `", "packageVersion": "` + docs[1].packageData[packageID].currentVersion.versionNumber + `", "expiry": "` + (Date.now() + 20000) + `"}`))), 'base64', 'base64') + hashedDataCipher.final('base64')
        hashedData = hashedData.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
        res.redirect(process.env.URL + `/secure-download/?auth=` + hashedData)
      } else {
        // TODO: Check if the user is logged in and then check if they own the package
        res.status(403).send()
        res.end()
      }
    })
  } else {
    res.status(404).send()
    res.end()
  }
})

app.use(Sentry.Handlers.errorHandler())

app.listen(port, () => pino.info(`Listening on port ${port}`))
