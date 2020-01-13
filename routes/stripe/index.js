const routes = require('express').Router()
const crypto = require('crypto')
const request = require('request')
const stripe = require('stripe')(process.env.stripeApi)

const database = require('../../modules/database.js')
const passport = require('../../modules/passport.js')
const logging = require('../../modules/logging.js')

// Stripe Management

routes.post('/stripe/register', passport.passport.authenticate('jwt'), function mainHandler (req, res) {
  res.cookie('token', req.body.token)
  database.findDocuments(req.db, 'vapasUsers', { id: req.user.sub }, function (docs) {
    if (docs[0].user.permissions.developer === true) {
      res.send('https://connect.stripe.com/express/oauth/authorize?redirect_uri=' + process.env.URL + '/stripe/registerCallback' + '' + '&client_id=' + process.env.stripeID + '&state=' + crypto.randomBytes(32))
    } else {
      res.sendStatus(401)
    }
  })
})

routes.get('/stripe/completePayment', function mainHandler (req, res) {
  const sig = request.headers['stripe-signature']

  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.stripeEndpoint);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object

    // Fulfill the purchase...
    database.findDocuments(req.db, 'vapasPackages', { packageName: req.params.packageID }, function (content) {
      database.findDocuments(req.db, 'vapasUsers', { id: req.user.sub }, function (user) {
        const userData = content[0].user
        if (!userData.packages.contains(session.client_reference_id)) {
          req.db.db('vapasContent').collection('vapasUsers').updateOne({ id: session.customer }
            , { $push: { 'user.packages': session.client_reference_id } }, function (err, result) {
              res.send(JSON.parse(`{ "status": "1", "url": "sileo://payment_completed" }`))
              if (err) {
                console.log(err)
                res.send(JSON.parse(`{ "status": "0", "url": "sileo://payment_completed" }`))
              }
            }
          )
        }
      })
    })
  }
})

routes.get('/stripe/registerCallback', passport.passport.authenticate('jwtCookie'), function mainHandler (req, res) {
  request({ uri: 'https://connect.stripe.com/oauth/token', method: 'POST', json: true, body: { client_secret: process.env.stripeApi, code: req.query.code, grant_type: 'authorization_code' } }, function (err, body) {
    if (err) {
      res.send(err)
      res.end()
      return
    }
    res.send(body.body)
    database.findDocuments(req.db, 'vapasUsers', { id: req.user.sub }, function (docs) {
      // Create stripe object in user document with body.access_token, body.refresh_token, body.stripe_publishable_key, and body.stripe_user_id
      req.db.db('vapasContent').collection('vapasUsers').updateOne({ id: req.user.sub }
        , { $push: { stripe: { accessToken: body.access_token, refreshToken: body.refresh_token, publishableKey: body.stripe_publishable_key, userID: body.stripe_user_id } } }, function (err, result) {
          if (err) {
            logging.pino.info(err)
          }
        }
      )
    })
  })
})

module.exports = routes
