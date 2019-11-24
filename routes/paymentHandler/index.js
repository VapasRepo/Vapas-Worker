const routes = require('express').Router()
const btoa = require('btoa')
const util = require('util')
const querystring = require('querystring')
const request = require('request')
const crypto = require('crypto')

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
  res.send('{"name": "Vapas", "icon": "' + process.env.URL + '/CydiaIcon.png", "description": "Vapas Pay", "authentication_banner": { "message": "Sign into Vapas to purchase and download paid packages.", "button": "Sign in" } }')
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
      logging.pino.info(info)
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

routes.post('/payment/package/:packageID/purchase', function mainHandler (req, res) {
  res.send(JSON.parse(`{ "status": "1", "url": "sileo://payment_completed" }`))
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

// Regular login

routes.get('/auth/authenticate', (req, res) => {
  if (!req.query.redirect) {
    res.send('Redirect required.')
    res.end()
    return
  }
  res.cookie('authRedirect', req.query.redirect)
  res.redirect('/auth/authenticate2')
})

routes.get('/auth/authenticate2', passport.passport.authenticate('authStrategy', { scope: 'profile openid' }), (req, res) => {
  if (!req.query.redirect) {
    res.send('Redirect required.')
    res.end()
    return
  }
  res.cookie('authRedirect', req.query.redirect)
  res.redirect('/')
})

routes.get('/auth/auth0callback', (req, res, next) => {
  if (!req.cookies.authRedirect) {
    res.send('Redirect required.')
    res.end()
    return
  }
  passport.passport.authenticate('authStrategy', function (err, user, info) {
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

module.exports = routes
