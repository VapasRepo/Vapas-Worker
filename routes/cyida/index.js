const routes = require('express').Router()
const compression = require('compression')

const database = require('../../modules/database.js')

// For some odd reason, Cyida navigates with (url)/./(path)

routes.get('/./Release', function mainHandler (req, res) {
  database.findDocuments(req.db, 'vapasInfomation', { object: 'release' }, function (docs) {
    let i
    for (i in docs[0].data) {
      res.write(i + ': ' + docs[0].data[i] + '\n')
    }
    database.dbClient.close()
    res.end()
  })
})

routes.get('/./CyidaIcon.png', function mainHandler (req, res) {
  res.sendFile('./assets/cyidaIcon.png', { root: './' })
})

routes.get('/./Packages.gz', compression(), function mainHandler (req, res) {
  database.findDocuments(req.db, 'vapasPackages', { }, function (docs) {
    let i
    for (i in docs) {
      const packageData = docs[i].package
      res.write('Package: ' + docs[i].packageName + '\n')
      res.write('Version: ' + packageData.currentVersion.version + '\n')
      res.write('Section: ' + packageData.section + '\n')
      res.write('Maintainer: ' + packageData.developer + '\n')
      res.write('Depends: ' + packageData.depends + '\n')
      res.write('Architecture: iphoneos-arm\n')
      res.write('Filename: /debs/' + docs[i].packageName + '_' + packageData.currentVersion.version + '_iphoneos-arm.deb\n')
      res.write('Size: ' + packageData.currentVersion.size + '\n')
      res.write('SHA256: ' + packageData.currentVersion.SHA256 + '\n')
      res.write('Description: ' + packageData.shortDescription + '\n')
      res.write('Name: ' + packageData.name + '\n')
      res.write('Author: ' + packageData.developer + '\n')
      res.write('Depiction: ' + process.env.URL + '/depiction/' + docs[i].packageName + '\n')
      res.write('SileoDepiction: ' + process.env.URL + '/sileodepiction/' + docs[i].packageName + '\n')
      if (packageData.price.toString() !== '0') {
        res.write('Tag: cydia::commercial\n')
      }
      res.write('Icon: ' + packageData.icon + '\n\n')
    }
    database.dbClient.close()
    res.end()
  })
})

module.exports = routes
