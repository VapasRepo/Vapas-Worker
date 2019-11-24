const dotenv = require('dotenv')
const env = dotenv.config()

if (env.error) {
  throw env.error
}

const MongoClient = require('mongodb').MongoClient
const assert = require('assert')

module.exports.dbClient = new MongoClient(env.parsed.dbURL)

module.exports.findDocuments = function (db, collectionName, search, callback) {
  var dbObject = db.db('vapasContent')
  const collection = dbObject.collection(collectionName)
  collection.find(search).toArray(function (err, docs) {
    assert.strictEqual(err, null)
    callback(docs)
  })
}
