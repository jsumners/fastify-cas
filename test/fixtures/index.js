'use strict'

const fs = require('fs')
const path = require('path')

module.exports = {
  v3: {
    success: () => fs.createReadStream(path.join(__dirname, 'v3.success.xml'))
  }
}
