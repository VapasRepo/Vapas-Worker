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

const app = express()

const port = 1406
dotenv.config()

// MongoDB Setup

const dbURL = process.env.dbURL
const dbName = 'vapasContent'
const dbClient = new MongoClient(dbURL)

app.use(expressMongoDb(dbURL))

const findDocuments = function(db, collectionName, callback) {
  var dbObject = db.db(dbName)
  const collection = dbObject.collection(collectionName)
  collection.find({}).toArray(function(err, docs) {
    assert.equal(err, null)
    callback(docs)
  })
}

// Sentry setup

Sentry.init({ dsn: process.env.SENTRYDSN });

app.use(Sentry.Handlers.requestHandler());

// Express Routing

app.use('/', express.static(path.join(__dirname, 'webDepictions')))

// For some odd reason, older cyida versions navigate with (url)/./(path)
app.get('/./*', function mainHandler(req, res) {
  res.set('location', req.originalUrl.substring(2));
  res.status(301).send()
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

app.get('/payment/info', function mainHandler(req, res) {
  res.send('{"name": "Vapas", "icon": "' + process.env.URL +'/CydiaIcon.png", "description": "Vapas Payment"}')
})

app.get('/payment_endpoint', function mainHandler(req, res) {
  res.send(process.env.URL + '/payment/')
})

app.get('/CydiaIcon.png', function mainHandler(req, res) {
  res.sendFile('./cyidaIcon.png', {root:'./'})
})

app.get('/footerIcon.png', function mainHandler(req, res) {
  res.sendFile('./footerIcon.png', {root:'./'})
})


// Open package manager when someone clicks "Add to package manager"

app.get('/cyidaRedirect', function mainHandler(req, res) {
  res.set('location','cydia://url/https://cydia.saurik.com/api/share#?' + process.env.URL);
  res.status(302).send()
})

// Packge content

app.get('/depiction/*', function mainHandler(req, res) {
})

// oh god oh fuck
app.get('/sileodepiction/*', function mainHandler(req, res) {
  findDocuments(req.db, 'vapasContent', function(docs) {
    packageData = docs[1].packageData[req.url.substring(16)]
    var knownIssues = ""
    var packagePrice = packageData.price.toString()
    if (packagePrice == "0") {
      var packagePrice = "Free"
    } else {
      var packagePrice = "$" + packagePrice
    }
    for (i in packageData.knownIssues) {
      knownIssues += '* ' + packageData.knownIssues[i] + '\\n'
    }
    sileoData = `{ "minVersion":"0.1", "headerImage":"` + packageData.headerImage + `", "tintColor": "` + packageData.tint + `", "tabs": [ { "tabname": "Details", "views": [ { "title": "` + packageData.shortDescription + `", "useBoldText": true, "useBottomMargin": false, "class": "DepictionSubheaderView" }, { "markdown": "` + packageData.longDescription + `", "useSpacing": true, "class": "DepictionMarkdownView" }, { "class": "DepictionSeparatorView" }, { "title": "Screenshots", "class": "DepictionHeaderView" }, { "itemCornerRadius": 6, "itemSize": "{160, 275.41333333333336}", "screenshots": [ { "accessibilityText": "Screenshot", "url": "` + packageData.screenshots[0] + `", "fullSizeURL": "` + packageData.screenshots[0] + `" } ], "class": "DepictionScreenshotView" }, { "class": "DepictionSeparatorView" }, { "title": "Known Issues", "class": "DepictionHeaderView" }, { "markdown": "` + knownIssues + `", "useSpacing": true, "class": "DepictionMarkdownView" }, { "class": "DepictionSeparatorView" }, { "title": "Package Information", "class": "DepictionHeaderView" }, { "title": "Version", "text": "` + packageData.currentVersion.versionNumber + `", "class": "DepictionTableTextView" }, { "title": "Released", "text": "` + moment(packageData.currentVersion.dateReleased).format('MMMM Do YYYY') + `", "class": "DepictionTableTextView" }, { "title": "Price", "text": "` + packagePrice + `", "class": "DepictionTableTextView" }, { "class": "DepictionSeparatorView" }, { "title": "Developer Infomation", "class": "DepictionHeaderView" },{ "class": "DepictionStackView" }, { "title": "Developer", "text": "` + packageData.developer + `", "class": "DepictionTableTextView" }, { "title": "Support (` + packageData.supportLink.name + `)", "action": "` + packageData.supportLink.url + `", "class": "DepictionTableButtonView" }, { "class": "DepictionSeparatorView" }, { "spacing": 10, "class": "DepictionSpacerView" }, {"URL": "` +process.env.URL + `/footerIcon.png", "width": 125, "height": 67.5, "cornerRadius": 0, "alignment": 1, "class": "DepictionImageView" } ], "class": "DepictionStackView" }], "class": "DepictionTabView" }`
    console.log(sileoData)
    res.send(JSON.parse(sileoData))
    dbClient.close()
    res.end()
  })
})

app.use(Sentry.Handlers.errorHandler());

app.listen(port, () => console.log(`Listening on port ${port}`))
