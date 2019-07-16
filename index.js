const express = require('express')
const dotenv = require('dotenv')
const Sentry = require('@sentry/node');

const app = express()

const port = 1406
dotenv.config()

Sentry.init({ dsn: process.env.SENTRYDSN });

app.use(Sentry.Handlers.requestHandler());

app.get('/', function mainHandler(req, res) {
  res.send('200')
})

app.get('/sileo-featured.json', function mainHandler(req, res) {
  res.send('')
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
