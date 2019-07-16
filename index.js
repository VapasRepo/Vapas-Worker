const express = require('express')
const dotenv = require('dotenv')

const app = express()

const port = 1406
dotenv.config()

app.get('/', (req, res) => res.send('200'))

app.get('/sileo-featured.json', (req, res) => res.send(''))

app.get('/Packages', (req, res) => res.send(''))

app.get('/Release', function (req, res) {
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

app.get('/payment/info', (req, res) => res.send('{"name": "Vapas", "icon": "' + process.env.URL +'/CydiaIcon.png", "description": "Vapas Payment"}'))


app.get('/payment_endpoint', (req, res) => res.send(process.env.URL + '/payment/'))

app.get('/CydiaIcon.png', (req, res) => res.sendFile('./icon.png', {root:'./'}))

app.listen(port, () => console.log(`Listening on port ${port}`))
