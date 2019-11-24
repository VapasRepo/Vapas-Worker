const dotenv = require('dotenv')
dotenv.config(process.env.stripeApi)
const express = require('express')
const Sentry = require('@sentry/node')
const expressMongoDb = require('express-mongo-db')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const btoa = require('btoa')
const expressSession = require('cookie-session')
const util = require('util')
const querystring = require('querystring')
const jwtCert = fs.readFileSync(path.resolve(__dirname, './vapas.cer'))
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt
// const stripe = require('stripe')(process.env.stripeApi)
const request = require('request')

const database = require('./modules/database.js')
const keys = require('./modules/keys.js')
const logging = require('./modules/logging.js')

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

passport.use('sileoStrategy', new Auth0Strategy({
  domain: process.env.auth0URL,
  clientID: process.env.auth0clientID,
  clientSecret: process.env.auth0clientSecret,
  callbackURL: process.env.URL + '/payment/auth0callback'
},
function (accessToken, refreshToken, extraParams, profile, done) {
  const token = extraParams.id_token
  return done(null, profile, token)
})
)
passport.use('authStrategy', new Auth0Strategy({
  domain: process.env.auth0URL,
  clientID: process.env.auth0clientID,
  clientSecret: process.env.auth0clientSecret,
  callbackURL: process.env.URL + '/auth/auth0callback'
},
function (accessToken, refreshToken, extraParams, profile, done) {
  const token = extraParams.id_token
  return done(null, profile, token)
}))

const authCookieExtract = function (req) {
  var token = null
  if (req && req.cookies) {
    token = req.cookies.token
  }
  return token
}

var opts = {}
opts.jwtFromRequest = ExtractJwt.fromBodyField('token')
opts.secretOrKey = jwtCert
passport.use('jwt', new JwtStrategy(opts, function (jwtPayload, done) {
  return done(null, jwtPayload)
}))

var opts2 = {}
opts2.jwtFromRequest = authCookieExtract
opts2.secretOrKey = jwtCert
passport.use('jwtCookie', new JwtStrategy(opts2, function (jwtPayload, done) {
  return done(null, jwtPayload)
}))

const app = express()

const port = 1406

// MongoDB Setup

const dbURL = process.env.dbURL

// Load express middleware

app.use(expressMongoDb(dbURL))

app.use(express.json())

app.use(logging.pinoExpress)

app.use(bodyParser.urlencoded({ extended: true }))

app.use(express.urlencoded({ extended: true }))

app.use(expressSession(session))

app.use(cookieParser())

app.use(passport.initialize())

app.use(passport.session())

passport.serializeUser((user, done) => {
  done(null, user)
})

passport.deserializeUser((user, done) => {
  done(null, user)
})

// Load routing

const coreInfoRoute = require('./routes/coreInfo')
const downloadRoute = require('./routes/download')
const depictionRoute = require('./routes/depictions')

app.use('/', coreInfoRoute)
app.use('/', downloadRoute)
app.use('/', depictionRoute)

// Sentry setup

Sentry.init({ dsn: process.env.SENTRYDSN })

app.use(Sentry.Handlers.requestHandler())

// Express Routing

app.use('/', express.static(path.join(__dirname, 'public')))

// Open package manager when someone clicks "Add to package manager"

app.get('/cyidaRedirect', function mainHandler (req, res) {
  res.set('location', 'cydia://url/https://cydia.saurik.com/api/share#?source=' +
    process.env.URL)
  res.status(302).send()
  res.end()
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

app.get('/payment/authenticate', passport.authenticate('sileoStrategy', { scope: 'profile openid' }), (req, res) => {
  res.redirect('/')
})

app.get('/payment/auth0callback', (req, res, next) => {
  passport.authenticate('sileoStrategy', function (err, user, info) {
    if (err) { return next(err) }
    if (!user) { return res.sendStatus((403)) }
    req.logIn(user, function (err) {
      if (err) { return next(err) }
      req.session.timestamp = new Date()
      logging.pino.info(info)
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
})

app.post('/payment/user_info', passport.authenticate('jwt', { session: false }), function mainHandler (req, res) {
  logging.pino.info(req.user.sub)
  database.findDocuments(req.db, 'vapasUsers', { id: req.user.sub }, function (docs) {
    if (!docs) {
      return false
    }
    logging.pino.info(docs[0])
    let userPackages = ''
    let i = ''
    logging.pino.info(docs[0].user.packages[0])
    for (i in docs[0].user.packages) {
      if (i.toString() === (docs[0].user.packages.length - 1).toString()) {
        userPackages += '"' + docs[0].user.packages[i] + '"'
      } else {
        userPackages += '"' + docs[0].user.packages[i] + '", '
      }
    }
    res.send(JSON.parse('{ "items": [ ' + userPackages + ' ], "user": { "name": "' + req.user.nickname + '", "email": "' + req.user.name + '" } }'))
  })
})

app.post('/payment/package/:packageID/info', passport.authenticate('jwt', { session: false }), function mainHandler (req, res) {
  database.findDocuments(req.db, 'vapasPackages', { packageName: req.params.packageID }, function (content) {
    database.findDocuments(req.db, 'vapasUsers', { id: req.user.sub }, function (user) {
      const packageData = content[0].package
      let purchased
      if (req.body.token !== undefined) {
        if (packageData.price !== 0) {
          let i
          for (i in user[0].user.packages) {
            if (user[0].user.packages[i] === req.params.packageID) {
              purchased = true
            }
          }
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

app.post('/payment/package/:packageID/authorize_download', passport.authenticate('jwt'), function mainHandler (req, res) {
  database.findDocuments(req.db, 'vapasPackages', { packageName: req.params.packageID }, function (docs) {
    // Key expires after 10 (20 for development) seconds from key creation
    const hashedDataCipher = crypto.createCipheriv(keys.cryptoAlgorithm, Buffer.from(keys.workerMasterKey, 'hex'), Buffer.from(keys.workerMasterIV, 'hex'))
    let hashedData = hashedDataCipher.update(btoa(JSON.stringify(JSON.parse(`{"udid": "` + req.body.udid + `", "packageID": "` + req.params.packageID + `", "packageVersion": "` + req.body.version + `", "expiry": "` + (Date.now() + 20000) + `"}`))), 'base64', 'base64') + hashedDataCipher.final('base64')
    hashedData = hashedData.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
    if (docs[0].package.price.toString() === '0') {
      res.send(JSON.parse(`{ "url": "` + process.env.URL + `/secure-download/?auth=` + hashedData + `" }`))
    } else {
      database.findDocuments(req.db, 'vapasUsers', { id: req.user.sub }, function (userDocs) {
        if (userDocs[0].user.packages.includes(req.params.packageID)) {
          res.send(JSON.parse(`{ "url": "` + process.env.URL + `/secure-download/?auth=` + hashedData + `" }`))
        }
      })
    }
  })
})

// Regular login

app.get('/auth/authenticate', (req, res) => {
  if (!req.query.redirect) {
    res.send('Redirect required.')
    res.end()
    return
  }
  res.cookie('authRedirect', req.query.redirect)
  res.redirect('/auth/authenticate2')
})

app.get('/auth/authenticate2', passport.authenticate('authStrategy', { scope: 'profile openid' }), (req, res) => {
  if (!req.query.redirect) {
    res.send('Redirect required.')
    res.end()
    return
  }
  res.cookie('authRedirect', req.query.redirect)
  res.redirect('/')
})

app.get('/auth/auth0callback', (req, res, next) => {
  if (!req.cookies.authRedirect) {
    res.send('Redirect required.')
    res.end()
    return
  }
  passport.authenticate('authStrategy', function (err, user, info) {
    if (err) { return next(err) }
    if (!user) { return res.sendStatus((403)) }
    req.logIn(user, function (err) {
      if (err) { return next(err) }
      req.session.timestamp = new Date()
      request({ uri: process.env.URL + req.cookies.authRedirect, method: 'POST', json: true, body: { token: info } }, function (err, body) {
        if (err) {
          res.send(err)
          res.end()
          return
        }
        res.redirect(body.body)
      })
    })
  })(req, res, next)
})

// Stripe Management

app.post('/stripe/register', passport.authenticate('jwt'), function mainHandler (req, res) {
  res.cookie('token', req.body.token)
  database.findDocuments(req.db, 'vapasUsers', { id: req.user.sub }, function (docs) {
    if (docs[0].user.permissions.developer === true) {
      res.send('https://connect.stripe.com/express/oauth/authorize?redirect_uri=' + process.env.URL + '/stripe/registerCallback' + '' + '&client_id=' + process.env.stripeID + '&state=' + crypto.randomBytes(32))
    } else {
      res.sendStatus(401)
    }
  })
})

app.get('/stripe/registerCallback', passport.authenticate('jwtCookie'), function mainHandler (req, res) {
  request({ uri: 'https://connect.stripe.com/oauth/token', method: 'POST', json: true, body: { client_secret: process.env.stripeApi, code: req.query.code, grant_type: 'authorization_code' } }, function (err, body) {
    if (err) {
      res.send(err)
      res.end()
      return
    }
    res.send(body.body)
    database.findDocuments(req.db, 'vapasUsers', { id: req.user.sub }, function (docs) {
      // Create stripe object in user document with body.access_token, body.refresh_token, body.stripe_publishable_key, and body.stripe_user_id
      req.db.collection('vapasUsers').updateOne({ id: req.user.sub }
        , { $set: { stripe: { accessToken: body.access_token, refreshToken: body.refresh_token, publishableKey: body.stripe_publishable_key, userID: body.stripe_user_id } } }, function (err, result) {
          if (err) {
            logging.pino.info(err)
          }
        }
      )
    })
  })
})

app.use(Sentry.Handlers.errorHandler())

app.listen(port, () => logging.pino.info(`Listening on port ${port}`))
