const express = require('express')
const dotenv = require('dotenv')
const Sentry = require('@sentry/node')
const Mongo = require('mongodb')
const MongoClient = require('mongodb').MongoClient
const assert = require('assert')
const compression = require('compression')
const expressMongoDb = require('express-mongo-db')
const moment = require('moment')
const path = require('path')
const bodyParser = require('body-parser')
const crypto = require('crypto')
const btoa = require('btoa')
const atob = require('atob')
const request = require('request')

// Crypto setup

const cryptoAlgorithm = 'aes-256-cbc'
// FIXME: God this is a bad idea, change this
const workerMasterKey = crypto.randomBytes(32)
const workerMasterIV = crypto.randomBytes(16)

const app = express()

const port = 1406
dotenv.config()

// MongoDB Setup

const dbURL = process.env.dbURL
const dbName = 'vapasContent'
const dbClient = new MongoClient(dbURL)

// Load express middleware

app.use(expressMongoDb(dbURL))

app.use(express.json())

app.use(express.urlencoded({ extended: true }))

// Sentry setup

Sentry.init({ dsn: process.env.SENTRYDSN });

app.use(Sentry.Handlers.requestHandler());

const findDocuments = function(db, collectionName, callback) {
  var dbObject = db.db(dbName)
  const collection = dbObject.collection(collectionName)
  collection.find({}).toArray(function(err, docs) {
    assert.equal(err, null)
    callback(docs)
  })
}

// Debug capture

/**
app.use(function mainHandler(req, res, next) {
  console.log('============================')
  console.log(req.url)
  console.log(req.secure)
  console.log(req.body)
  console.log(req.params)
  console.log(req.query)
  console.log(req.route)
  delete req.headers['connection']
  next()
})

app.set('etag', false)

**/

// Express Routing

app.use('/', express.static(path.join(__dirname, 'webDepictions')))

// For some odd reason, older cyida versions navigate with (url)/./(path)
app.get('/./*', function mainHandler(req, res) {
  res.set('location', req.originalUrl.substring(2));
  res.status(308).send()
})

//Core repo infomation

app.get('/sileo-featured.json', function mainHandler(req, res) {
  findDocuments(req.db, 'vapasInfomation', function(docs) {
    res.send(docs[0].featured)
    dbClient.close()
    res.end()
  })
})

app.get('/Packages', function mainHandler(req, res) {
  findDocuments(req.db, 'vapasContent', function(docs) {
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

app.get('/Packages.gz', compression(), function mainHandler(req, res) {
  findDocuments(req.db, 'vapasContent', function(docs) {
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

app.get('/Release', function mainHandler(req, res) {
  findDocuments(req.db, 'vapasInfomation', function(docs) {
    for (i in docs[1].Release) {
      res.write(i + ': ' + docs[1].Release[i] + '\n')
    }
    dbClient.close()
    res.end()
  })
})


app.get('/CydiaIcon.png', function mainHandler(req, res) {
  res.sendFile('./cyidaIcon.png', {root:'./'})
})

app.get('/footerIcon.png', function mainHandler(req, res) {
  res.sendFile('./footerIcon.png', {root:'./'})
})


// Open package manager when someone clicks "Add to package manager"

app.get('/cyidaRedirect', function mainHandler(req, res) {
  res.set('location','cydia://url/https://cydia.saurik.com/api/share#?source='
    + process.env.URL);
  res.status(302).send()
  res.end()
})

// Packge content

app.get('/depiction/:packageID', function mainHandler(req, res) {
})

// oh god oh fuck
app.get('/sileodepiction/:packageID', function mainHandler(req, res) {
  findDocuments(req.db, 'vapasContent', function(docs) {
    packageData = docs[1].packageData[req.params.packageID]
    var knownIssues = ""
    var packagePrice = packageData.price.toString()
    var screenshots = ""
    if (packagePrice == "0") {
      var packagePrice = "Free"
    } else {
      var packagePrice = "$" + packagePrice
    }
    for (i in packageData.knownIssues) {
      knownIssues += '* ' + packageData.knownIssues[i] + '\\n'
    }
    for (i in packageData.screenshots) {
      if (i.toString() === (packageData.screenshots.length - 1).toString()) {
        screenshots += `{ "accessibilityText": "Screenshot", "url": "` + packageData.screenshots[i] + `", "fullSizeURL": "` + packageData.screenshots[i] + `" }`
      } else {
        screenshots += `{ "accessibilityText": "Screenshot", "url": "` + packageData.screenshots[i] + `", "fullSizeURL": "` + packageData.screenshots[i] + `" },`
      }
    }
    sileoData = `{ "minVersion":"0.1", "headerImage":"` + packageData.headerImage + `", "tintColor": "` + packageData.tint + `", "tabs": [ { "tabname": "Details", "views": [ { "title": "` + packageData.shortDescription + `", "useBoldText": true, "useBottomMargin": false, "class": "DepictionSubheaderView" }, { "markdown": "` + packageData.longDescription + `", "useSpacing": true, "class": "DepictionMarkdownView" }, { "class": "DepictionSeparatorView" }, { "title": "Screenshots", "class": "DepictionHeaderView" }, { "itemCornerRadius": 6, "itemSize": "{160, 275.41333333333336}", "screenshots": [ ` + screenshots + ` ], "ipad": { "itemCornerRadius": 9, "itemSize": "{320, 550.8266666666667}", "screenshots": [ ` + screenshots + ` ], "class": "DepictionScreenshotView" }, "class": "DepictionScreenshotsView" }, { "class": "DepictionSeparatorView" }, { "title": "Known Issues", "class": "DepictionHeaderView" }, { "markdown": "` + knownIssues + `", "useSpacing": true, "class": "DepictionMarkdownView" }, { "class": "DepictionSeparatorView" }, { "title": "Package Information", "class": "DepictionHeaderView" }, { "title": "Version", "text": "` + packageData.currentVersion.versionNumber + `", "class": "DepictionTableTextView" }, { "title": "Released", "text": "` + moment(packageData.currentVersion.dateReleased).format('MMMM Do YYYY') + `", "class": "DepictionTableTextView" }, { "title": "Price", "text": "` + packagePrice + `", "class": "DepictionTableTextView" }, { "class": "DepictionSeparatorView" }, { "title": "Developer Infomation", "class": "DepictionHeaderView" },{ "class": "DepictionStackView" }, { "title": "Developer", "text": "` + packageData.developer + `", "class": "DepictionTableTextView" }, { "title": "Support (` + packageData.supportLink.name + `)", "action": "` + packageData.supportLink.url + `", "class": "DepictionTableButtonView" }, { "class": "DepictionSeparatorView" }, { "spacing": 10, "class": "DepictionSpacerView" }, {"URL": "` +process.env.URL + `/footerIcon.png", "width": 125, "height": 67.5, "cornerRadius": 0, "alignment": 1, "class": "DepictionImageView" } ], "class": "DepictionStackView" }], "class": "DepictionTabView" }`
    //console.log(sileoData)
    res.send(JSON.parse(sileoData))
    dbClient.close()
    res.end()
  })
})

// Payment handler

app.get('/payment_endpoint', function mainHandler(req, res) {
  res.send(process.env.URL + '/payment/')
})

app.get('/payment', function mainHandler(req, res) {
  res.status(200).send()
  res.end()
})

app.get('/payment/info', function mainHandler(req, res) {
  res.send('{"name": "Vapas", "icon": "' + process.env.URL +'/CydiaIcon.png", "description": "Vapas Payment", "authentication_banner": { "message": "Sign into Vapas to purchase and download paid packages.", "button": "Sign in" } }')
})

// Send back that we are authed, add actual code later

app.get('/payment/authenticate', function mainHandler(req, res) {
  res.set('location','sileo://authentication_success?token=f2ca1bb6c7e907d06dafe4687e579fce&payment_secret=bigpp')
  res.status(302).send()
  res.end()
})

app.post('/payment/sign_out', function mainHandler(req, res) {
  res.send(JSON.parse('{ "success": true }'))
})

app.post('/payment/user_info', function mainHandler(req, res) {
  res.send(JSON.parse('{ "items": [ ], "user": { "name": "pp", "email": "bigpp@pp.com" } }'))
})

app.post('/payment/package/:packageID/info', function mainHandler(req, res) {
  console.log("hey sileo you wanna send us data?")
  packageData = docs[1].packageData[req.params.packageID]
  res.send(JSON.parse(`{ "price": "$` + packageData.price +`", "purchased": false, "available": true }`))
})

app.post('/payment/package/:packageID/purchase', function mainHandler(req, res) {
  console.log("hey sileo you wanna send us data?")
  res.send(JSON.parse(`{ "status": "1", "url": "sileo://payment_completed" }`))
})


app.post('/payment/package/:packageID/authorize_download', function mainHandler(req, res) {

  // Key expires after 10 (20 for development) seconds from key creation
  let hashedDataCipher = crypto.createCipheriv(cryptoAlgorithm, Buffer.from(workerMasterKey, 'hex'), Buffer.from(workerMasterIV, 'hex'))
  let hashedData = hashedDataCipher.update(btoa(JSON.stringify(JSON.parse(`{"udid": "` + req.body.udid + `", "packageID": "` + req.params.packageID + `", "packageVersion": "` + req.body.version + `", "expiry": "` + (Date.now() + 20000) + `"}`))),  'base64', 'base64') + hashedDataCipher.final('base64')
  hashedData = hashedData.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')

  res.send(JSON.parse(`{ "url": "` + process.env.URL + `/secure-download/?auth=` + hashedData + `" }`))
})

// Secure download

app.get('/secure-download/', function mainHandler(req, res) {
  if (req.query.auth != null) {
    authKey = req.query.auth.replace('-', '+').replace('_', '/')
    while (authKey.length % 4)
      authKey += '='
    let hashedDataDecipher = crypto.createDecipheriv(cryptoAlgorithm, Buffer.from(workerMasterKey, 'hex'), Buffer.from(workerMasterIV, 'hex'))
    let hashedData
    try {
      hashedData = JSON.parse(atob(hashedDataDecipher.update(authKey, 'base64', 'base64') + hashedDataDecipher.final('base64')))
    }
    catch (err) {
      res.status(403).send()
      res.end()
      console.log('[SECURITY] Blocked key error')
    }
    if ( hashedData.expiry >= Date.now()) {
      console.log('[SECURITY] Allowed download attempt from udid ' + hashedData.udid)
      console.log('[DEBUG] Recived params:')
      console.log('packageID: ' + hashedData.packageID)
      console.log('packageVersion: ' + hashedData.packageVersion)
      console.log('udid: ' + hashedData.udid)
      console.log('key: ' + req.query.auth)
      console.log('expiry: ' + hashedData.expiry)
      console.log('currentTime: ' + Date.now())
      res.download(`./debs/` + hashedData.packageID  + '_' + hashedData.packageVersion + `_iphoneos-arm.deb`)
    } else {
      res.status(403).send()
      res.end()
      console.log('[SECURITY] Blocked download attempt from udid ' + hashedData.udid + ' (Link expired)')
      console.log('[DEBUG] Recived params:')
      console.log('packageID: ' + hashedData.packageID)
      console.log('packageVersion: ' + hashedData.packageVersion)
      console.log('udid: ' + hashedData.udid)
      console.log('key: ' + req.query.auth)
      console.log('expiry: ' + hashedData.expiry)
      console.log('currentTime: ' + Date.now())
    }
  } else {
    res.status(403).send()
    res.end()
  }
})

// Insecure download

app.get('/debs/:packageID', function mainHandler(req, res) {
  if (req.params.packageID != "") {
    findDocuments(req.db, 'vapasContent', function(docs) {
      let packageID = req.params.packageID.substring(0, req.params.packageID.indexOf('_')).toString()
      if (docs[1].packageData[packageID].price.toString() === "0") {
        let hashedDataCipher = crypto.createCipheriv(cryptoAlgorithm, Buffer.from(workerMasterKey, 'hex'), Buffer.from(workerMasterIV, 'hex'))
        let hashedData = hashedDataCipher.update(btoa(JSON.stringify(JSON.parse(`{ "udid":"4e1243bd22c66e76c2ba9eddc1f91394e57f9f83", "packageID": "` + packageID + `", "packageVersion": "` + docs[1].packageData[packageID].currentVersion.versionNumber + `", "expiry": "` + (Date.now() + 20000) + `"}`))),  'base64', 'base64') + hashedDataCipher.final('base64')
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

app.use(Sentry.Handlers.errorHandler());

app.listen(port, () => console.log(`Listening on port ${port}`))
