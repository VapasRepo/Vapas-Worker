const routes = require('express').Router()
const btoa = require('btoa')
const util = require('util')
const querystring = require('querystring')
const crypto = require('crypto')
const stripe = require('stripe')(process.env.stripeApi)

const database = require('../../modules/database.js')
const logging = require('../../modules/logging.js')
const keys = require('../../modules/keys.js')
const passport = require('../../modules/passport.js')

// Payment handler

routes.get('/payment_endpoint', function mainHandler (req, res) {
  res.send(process.env.URL + '/payment/')
})

routes.get('/payment', function mainHandler (req, res) {
  res.status(200).send()
  res.end()
})

routes.get('/payment/info', function mainHandler (req, res) {
  res.send('{"name": "Vapas", "icon": "' + process.env.URL + '/CydiaIcon.png", "description": "Sign into Vapas to purchase and download paid packages.", "authentication_banner": { "message": "Sign into Vapas to purchase and download paid packages.", "button": "Sign in" } }')
})

routes.get('/payment/authenticate', passport.passport.authenticate('sileoStrategy', { scope: 'profile openid' }), (req, res) => {
  res.redirect('/')
})

routes.get('/payment/auth0callback', (req, res, next) => {
  passport.passport.authenticate('sileoStrategy', function (err, user, info) {
    if (err) { return next(err) }
    if (!user) { return res.sendStatus((403)) }
    req.logIn(user, function (err) {
      if (err) { return next(err) }
      req.session.timestamp = new Date()
      console.log(info)
      res.redirect('sileo://authentication_success?token=' + info + '&payment_secret=piss')
    })
  })(req, res, next)
})

routes.post('/payment/sign_out', function mainHandler (req, res) {
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

routes.post('/payment/user_info', passport.passport.authenticate('jwt', { session: false }), function mainHandler (req, res) {
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

routes.post('/payment/package/:packageID/info', passport.passport.authenticate('jwt', { session: false }), function mainHandler (req, res) {
  database.findDocuments(req.db, 'vapasPackages', { packageName: req.params.packageID }, function (content) {
    database.findDocuments(req.db, 'vapasUsers', { id: req.user.sub }, function (user) {
      const packageData = content[0].package
      let purchased
      if (req.body.token !== undefined && packageData.price !== 0) {
        let i
        for (i in user[0].user.packages) {
          if (user[0].user.packages[i] === req.params.packageID) {
            purchased = true
          }
        }
      } else {
        purchased = false
      }
      res.send(JSON.parse(`{ "price": "$` + packageData.price + `", "purchased": ` + purchased + `, "available": true }`))
    })
  })
})

routes.post('/payment/package/:packageID/purchase', passport.passport.authenticate('jwt'), function mainHandler (req, res) {
  database.findDocuments(req.db, 'vapasPackages', { packageName: req.params.packageID }, function (content) {
    const packageData = content[0].package
    database.findDocuments(req.db, 'vapasUsers', { id: packageData.developerID }, function (user) {
      database.findDocuments(req.db, 'vapasUsers', { id: req.user.sub }, function (customerUser) {
        if (customerUser[0].user.stripe.customer_id === null || customerUser[0].user.stripe === null) {
          console.log('Creating new customer')
          stripe.customers.create({
            description: req.user.sub
          }, function (err, customer) {
            if (err) {
              console.log(err)
              res.sendStatus(500)
            }
            req.db.db('vapasContent').collection('vapasUsers').updateOne({ id: req.user.sub }, { $set: { 'stripe.customer_id': customer.id } }
              , function (err, result) {
                if (err) {
                  console.log(err)
                  res.sendStatus(500)
                }
              })
          })
        }
        const userData = user[0].user
        stripe.checkout.sessions.create({
          mode: 'payment',
          customer: customerUser[0].user.stripe.customer_id,
          customer_email: req.user.email,
          client_reference_id: req.params.packageID,
          payment_method_types: ['card'],
          line_items: [{
            name: packageData.name,
            description: packageData.shortDescription,
            images: [packageData.headerImage],
            amount: parseInt(packageData.price.toString().replace('.', ''), 10),
            currency: 'cad',
            quantity: 1
          }],
          success_url: 'https://development.vapas.gq/stripe/completePayment',
          cancel_url: 'https://development.vapas.gq/stripe/cancelPayment'
        }, {
          stripe_account: userData.stripe.stripe_user_id
        },
        function (err, session) {
          console.log(err)
          res.send(`<script src="https://js.stripe.com/v3/"></script> <script>var stripe = Stripe('` + process.env.stripeApiPK + `', {stripeAccount: '` + userData.stripe.stripe_user_id + `'}); function loadStripe(){stripe.redirectToCheckout({sessionId: '` + session.id + `'});}</script><body onload="loadStripe()"><h1>You shouldn't see this, contact support</h1></body>`)
        })
      })
    })
  })
})

routes.post('/payment/package/:packageID/authorize_download', passport.passport.authenticate('jwt'), function mainHandler (req, res) {
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

module.exports = routes
