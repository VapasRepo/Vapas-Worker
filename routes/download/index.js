const routes = require('express').Router()
const atob = require('atob')
const btoa = require('btoa')
const crypto = require('crypto')

const database = require('../../modules/database.js')
const keys = require('../../modules/keys.js')
const logging = require('../../modules/logging.js')

// Secure download

routes.get('/secure-download/', function mainHandler (req, res) {
  if (req.query.auth !== null) {
    var authKey = req.query.auth.replace('-', '+').replace('_', '/')
    while (authKey.length % 4) { authKey += '=' }
    const hashedDataDecipher = crypto.createDecipheriv(keys.cryptoAlgorithm, Buffer.from(keys.workerMasterKey, 'hex'), Buffer.from(keys.workerMasterIV, 'hex'))
    let hashedData
    try {
      hashedData = JSON.parse(atob(hashedDataDecipher.update(authKey, 'base64', 'base64') + hashedDataDecipher.final('base64')))
    } catch (err) {
      res.status(403).send()
      res.end()
      logging.pino.warn('Blocked key error')
    }
    if (hashedData.expiry >= Date.now()) {
      res.download(`./debs/` + hashedData.packageID + '_' + hashedData.packageVersion + `_iphoneos-arm.deb`)
    } else {
      res.status(403).send()
      res.end()
      logging.pino.warn('Blocked download attempt from udid ' + hashedData.udid + ' (Link expired)')
    }
  } else {
    res.status(403).send()
    res.end()
  }
})

// Insecure download

routes.get('*/debs/:packageID', function mainHandler (req, res) {
  if (req.params.packageID !== '') {
    const packageID = req.params.packageID.substring(0, req.params.packageID.indexOf('_')).toString()
    database.findDocuments(req.db, 'vapasPackages', { packageName: packageID }, function (docs) {
      if (docs[0].package.price.toString() === '0') {
        const hashedDataCipher = crypto.createCipheriv(keys.cryptoAlgorithm, Buffer.from(keys.workerMasterKey, 'hex'), Buffer.from(keys.workerMasterIV, 'hex'))
        let hashedData = hashedDataCipher.update(btoa(JSON.stringify(JSON.parse(`{ "udid":"4e1243bd22c66e76c2ba9eddc1f91394e57f9f83", "packageID": "` + packageID + `", "packageVersion": "` + docs[0].package.currentVersion.version + `", "expiry": "` + (Date.now() + 20000) + `"}`))), 'base64', 'base64') + hashedDataCipher.final('base64')
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

module.exports = routes
