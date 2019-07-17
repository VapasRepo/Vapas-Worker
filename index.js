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

app.get('/', function mainHandler(req, res) {
  res.send('200')
})

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
  res.sendFile('./icon.png', {root:'./'}) 
})

app.use(Sentry.Handlers.errorHandler());

app.listen(port, () => console.log(`Listening on port ${port}`))
