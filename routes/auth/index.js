const routes = require('express').Router()
const request = require('request')

const passport = require('../../modules/passport.js')

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
      if (req.cookies.authRedirect === 'browser') {
        res.cookie('token', info)
        res.redirect(process.env.URL + '/auth/account')
      } else if (req.cookies.authRedirect === 'package') {
        res.cookie('token', info)
        res.redirect(process.env.URL + '/loginCompleted.html')
      } else {
        request({ uri: process.env.URL + req.cookies.authRedirect, method: 'POST', json: true, body: { token: info } }, function (err, body) {
          if (err) {
            res.send(err)
            res.end()
            return
          }
          res.redirect(body.body)
        })
      }
    })
  })(req, res, next)
})

module.exports = routes
