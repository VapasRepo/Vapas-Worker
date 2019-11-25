const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt
const fs = require('fs')
const crypto = require('crypto')
const path = require('path')

const jwtCert = fs.readFileSync(path.join(__dirname, './vapas.cer'))

module.exports.Auth0Strategy = require('passport-auth0')
module.exports.passport = require('passport')

module.exports.session = {
  secret: crypto.randomBytes(8).toString(),
  cookie: {},
  resave: false,
  saveUninitialized: true
}

this.session.cookie.secure = true

this.passport.use('sileoStrategy', new this.Auth0Strategy({
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
this.passport.use('authStrategy', new this.Auth0Strategy({
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
this.passport.use('jwt', new JwtStrategy(opts, function (jwtPayload, done) {
  return done(null, jwtPayload)
}))

var opts2 = {}
opts2.jwtFromRequest = authCookieExtract
opts2.secretOrKey = jwtCert
this.passport.use('jwtCookie', new JwtStrategy(opts2, function (jwtPayload, done) {
  return done(null, jwtPayload)
}))
