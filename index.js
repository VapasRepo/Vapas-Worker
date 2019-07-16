const express = require('express')
const dotenv = require('dotenv')
const Sentry = require('@sentry/node')
const Mongo = require('mongodb')
const MongoClient = require('mongodb').MongoClient
const assert = require('assert')
var expressMongoDb = require('express-mongo-db')

const app = express()

const port = 1406
dotenv.config()

// MongoDB Setup

const dbURL = process.env.dbURL
const dbName = 'vapasContent'
const dbClient = new MongoClient(dbURL)

app.use(expressMongoDb(dbURL))

const findDocuments = function(db, callback) {
  var dbObject = db.db(dbName)
  const collection = dbObject.collection('vapasContent')
  collection.find({'_id' : Mongo.ObjectId('5d2e29d2caa41164b9ff49c2')}).toArray(function(err, docs) {
    assert.equal(err, null)
    callback(docs)
  })
}

// Sentry setup

Sentry.init({ dsn: process.env.SENTRYDSN });

app.use(Sentry.Handlers.requestHandler());

// Express Routing

app.get('/', function mainHandler(req, res) {
  res.send('200')
})

app.get('/sileo-featured.json', function mainHandler(req, res) {
  findDocuments(req.db, function(docs) {
    res.send(docs[0].featured)
    dbClient.close()
  })
})

app.get('/Packages', function mainHandler(req, res) {
  res.send('')
})

app.get('/Release', function mainHandler(req, res) {
  res.write("Origin: Vapas \n")
  res.write("Label: Vapas \n")
  res.write("Suite: stable \n")
  res.write("Version: 1.0 \n")
  res.write("Codename: ios \n")
  res.write("Architectures: iphoneos-arm \n")
  res.write("Components: main \n")
  res.write("Description: Vapas Repo Development")
  res.end()
})

app.get('/payment/info', function mainHandler(req, res) {
  res.send('{"name": "Vapas", "icon": "' + process.env.URL +'/CydiaIcon.png", "description": "Vapas Payment"}')
})

app.get('/payment_endpoint', function mainHandler(req, res) {
  res.send(process.env.URL + '/payment/')
})

app.get('/CydiaIcon.png', function mainHandler(req, res) {
  res.sendFile('./icon.png', {root:'./'}) 
})

app.use(Sentry.Handlers.errorHandler());

app.listen(port, () => console.log(`Listening on port ${port}`))
