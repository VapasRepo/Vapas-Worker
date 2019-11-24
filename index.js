const dotenv = require('dotenv')
dotenv.config(process.env.stripeApi)
const express = require('express')
const Sentry = require('@sentry/node')
const expressMongoDb = require('express-mongo-db')
const path = require('path')
const crypto = require('crypto')
const expressSession = require('cookie-session')

const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')

// const stripe = require('stripe')(process.env.stripeApi)
const request = require('request')

const database = require('./modules/database.js')
const logging = require('./modules/logging.js')
const passport = require('./modules/passport.js')

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

app.use(expressSession(passport.session))

app.use(cookieParser())

app.use(passport.passport.initialize())

app.use(passport.passport.session())

passport.passport.serializeUser((user, done) => {
  done(null, user)
})

passport.passport.deserializeUser((user, done) => {
  done(null, user)
})

// Load routing

const coreInfoRoute = require('./routes/coreInfo')
const downloadRoute = require('./routes/download')
const depictionRoute = require('./routes/depictions')
const cyidaRoute = require('./routes/cyida')
const paymentHandlerRoute = require('./routes/paymentHandler')

app.use('/', coreInfoRoute)
app.use('/', downloadRoute)
app.use('/', depictionRoute)
app.use('/', cyidaRoute)
app.use('/', paymentHandlerRoute)

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

// Stripe Management

app.post('/stripe/register', passport.passport.authenticate('jwt'), function mainHandler (req, res) {
  res.cookie('token', req.body.token)
  database.findDocuments(req.db, 'vapasUsers', { id: req.user.sub }, function (docs) {
    if (docs[0].user.permissions.developer === true) {
      res.send('https://connect.stripe.com/express/oauth/authorize?redirect_uri=' + process.env.URL + '/stripe/registerCallback' + '' + '&client_id=' + process.env.stripeID + '&state=' + crypto.randomBytes(32))
    } else {
      res.sendStatus(401)
    }
  })
})

app.get('/stripe/registerCallback', passport.passport.authenticate('jwtCookie'), function mainHandler (req, res) {
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
