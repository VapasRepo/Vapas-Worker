const pinoPre = require('pino')

module.exports.pino = require('pino')(pinoPre.destination('./logs/vapas_' + Date() + '.log'))
module.exports.pinoExpress = require('express-pino-logger')(pinoPre.destination('./logs/vapas_' + Date() + '.log'))
