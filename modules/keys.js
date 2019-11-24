const crypto = require('crypto')

module.exports.cryptoAlgorithm = 'aes-256-cbc'
module.exports.workerMasterKey = crypto.randomBytes(32)
module.exports.workerMasterIV = crypto.randomBytes(16)