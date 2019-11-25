const dotenv = require('dotenv')
dotenv.config(process.env.stripeApi)
const express = require('express')
const Sentry = require('@sentry/node')
const expressMongoDb = require('express-mongo-db')
const path = require('path')
const expressSession = require('cookie-session')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')

const logging = require('./modules/logging.js')
const passport = require('./modules/passport.js')

const app = express()

const port = 1406

// Load express middleware

app.use(expressMongoDb(process.env.dbURL))

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

// Express routing

const coreInfoRoute = require('./routes/coreInfo')
const downloadRoute = require('./routes/download')
const depictionRoute = require('./routes/depictions')
const cyidaRoute = require('./routes/cyida')
const paymentHandlerRoute = require('./routes/paymentHandler')
const stripeRoute = require('./routes/stripe')
const authRoute = require('./routes/auth')

app.use('/', coreInfoRoute)
app.use('/', downloadRoute)
app.use('/', depictionRoute)
app.use('/', cyidaRoute)
app.use('/', paymentHandlerRoute)
app.use('/', stripeRoute)
app.use('/', authRoute)

app.use('/', express.static(path.join(__dirname, 'public')))

// Sentry setup

Sentry.init({ dsn: process.env.SENTRYDSN })

app.use(Sentry.Handlers.requestHandler())

// Open package manager when someone clicks "Add to package manager"

app.get('/cyidaRedirect', function mainHandler (req, res) {
  res.set('location', 'cydia://url/https://cydia.saurik.com/api/share#?source=' +
    process.env.URL)
  res.status(302).send()
  res.end()
})

app.use(Sentry.Handlers.errorHandler())

app.listen(port, () => logging.pino.info(`Listening on port ${port}`))
