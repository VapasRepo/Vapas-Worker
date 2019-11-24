const routes = require('express').Router()

const database = require('../../modules/database.js')

// For some odd reason, Cyida navigates with (url)/./(path)

routes.get('/./Release', function mainHandler (req, res) {
  database.findDocuments(req.db, 'vapasInfomation', { object: 'release' }, function (docs) {
    var i
    for (i in docs[0].data) {
      res.write(i + ': ' + docs[0].data[i] + '\n')
    }
    database.dbClient.close()
    res.end()
  })
})

routes.get('/./Packages', function mainHandler (req, res) {
  database.findDocuments(req.db, 'vapasInfomation', { object: 'packages' }, function (docs) {
    var x, i
    for (x in docs[0].data) {
      for (i in docs[0].data[x]) {
        res.write(i + ': ' + docs[0].data[x][i] + '\n')
      }
      res.write('\n')
    }
    database.dbClient.close()
    res.end()
  })
})

module.exports = routes
