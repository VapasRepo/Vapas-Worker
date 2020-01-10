const routes = require('express').Router()
const moment = require('moment')
const pug = require('pug')

const database = require('../../modules/database.js')

// Legacy Depictions

routes.get('/depiction/:packageID', function mainHandler (req, res) {
  database.findDocuments(req.db, 'vapasPackages', { packageName: req.params.packageID }, function (docs) {
    const compiledFunction = pug.compileFile('./public/depictions/depiction.pug')
    const packageData = docs[0].package
    let packagePrice
    if (packageData.price.toString() === '0') {
      packagePrice = 'Free'
    } else {
      packagePrice = '$' + packageData.price
    }
    res.write(compiledFunction({ tweakShortDesc: packageData.shortDescription, tweakLongDesc: packageData.longDescription, price: packagePrice, developer: packageData.developer, version: packageData.currentVersion.version.toString(), releaseDate: moment(packageData.currentVersion.dateReleased).format('MMMM Do YYYY'), issueList: packageData.knownIssues, changeList: packageData.currentVersion.changeLog, supportName: packageData.supportLink.name, supportLink: packageData.supportLink.url }))
    database.dbClient.close()
    res.end()
  })
})

// Native Depictions

routes.get('/sileodepiction/:packageID', function mainHandler (req, res) {
  database.findDocuments(req.db, 'vapasPackages', { packageName: req.params.packageID }, function (docs) {
    var screenshots = ''
    var knownIssues = ''
    var changeLog = ''
    var packageData = docs[0].package
    let packagePrice
    if (packageData.price.toString() === '0') {
      packagePrice = 'Free'
    } else {
      packagePrice = '$' + packageData.price.toString()
    }
    var i
    for (i in packageData.knownIssues) {
      knownIssues += '* ' + packageData.knownIssues[i] + '\\n'
    }
    i = 0
    for (i in packageData.screenshots) {
      if (i.toString() === (packageData.screenshots.length - 1).toString()) {
        screenshots += `{ "accessibilityText": "Screenshot", "url": "` + packageData.screenshots[i] + `", 
        "fullSizeURL": "` + packageData.screenshots[i] + `" }`
      } else {
        screenshots += `{ "accessibilityText": "Screenshot", "url": "` + packageData.screenshots[i] + `", 
        "fullSizeURL": "` + packageData.screenshots[i] + `" },`
      }
    }
    i = 0
    for (i in packageData.currentVersion.changeLog) {
      if (i.toString() === (packageData.currentVersion.changeLog.length - 1).toString()) {
        changeLog += `* ` + packageData.currentVersion.changeLog[i]
      } else {
        changeLog += `* ` + packageData.currentVersion.changeLog[i] + `\\n`
      }
    }
    var sileoData = `{ "minVersion":"0.1", "headerImage":"` + packageData.headerImage + `", "tintColor": "` + packageData.tint + `", "tabs": [ { "tabname": "Details", "views": [ { "title": "` + packageData.shortDescription + `", "useBoldText": true, "useBottomMargin": false, "class": "DepictionSubheaderView" }, { "markdown": "` + packageData.longDescription + `", "useSpacing": true, "class": "DepictionMarkdownView" }, { "class": "DepictionSeparatorView" }, { "title": "Screenshots", "class": "DepictionHeaderView" }, { "itemCornerRadius": 6, "itemSize": "{160, 275.41333333333336}", "screenshots": [ ` + screenshots + ` ], "ipad": { "itemCornerRadius": 9, "itemSize": "{320, 550.8266666666667}", "screenshots": [ ` + screenshots + ` ], "class": "DepictionScreenshotView" }, "class": "DepictionScreenshotsView" }, { "class": "DepictionSeparatorView" }, { "title": "Known Issues", "class": "DepictionHeaderView" }, { "markdown": "` + knownIssues + `", "useSpacing": true, "class": "DepictionMarkdownView" }, { "class": "DepictionSeparatorView" }, { "title": "Package Information", "class": "DepictionHeaderView" }, { "title": "Version", "text": "` + packageData.currentVersion.version + `", "class": "DepictionTableTextView" }, { "title": "Released", "text": "` + moment(packageData.currentVersion.dateReleased).format('MMMM Do YYYY') + `", "class": "DepictionTableTextView" }, { "title": "Price", "text": "` + packagePrice + `", "class": "DepictionTableTextView" }, { "class": "DepictionSeparatorView" }, { "title": "Developer Infomation", "class": "DepictionHeaderView" },{ "class": "DepictionStackView" }, { "title": "Developer", "text": "` + packageData.developer + `", "class": "DepictionTableTextView" }, { "title": "Support (` + packageData.supportLink.name + `)", "action": "` + packageData.supportLink.url + `", "class": "DepictionTableButtonView" }, { "class": "DepictionSeparatorView" }, { "spacing": 10, "class": "DepictionSpacerView" }, {"URL": "` + process.env.URL + `/footerIcon.png", "width": 125, "height": 67.5, "cornerRadius": 0, "alignment": 1, "class": "DepictionImageView" } ], "class": "DepictionStackView" }, { "tabname": "Changelog", "views": [{ "title": "Version ` + packageData.currentVersion.version + `", "useBoldText": true, "useBottomMargin": true, "class": "DepictionSubheaderView" }, { "markdown": "` + changeLog + `", "useSpacing": false, "class": "DepictionMarkdownView" } ], "class": "DepictionStackView" } ], "class": "DepictionTabView" }`
    console.log(sileoData)
    res.send(JSON.parse(sileoData))
    database.dbClient.close()
    res.end()
  })
})

module.exports = routes
