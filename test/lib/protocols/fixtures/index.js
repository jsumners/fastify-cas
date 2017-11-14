'use strict'

const fs = require('fs')
const path = require('path')

function getFixture (name) {
  const fp = path.join(__dirname, name)
  return fs.readFileSync(fp)
}

module.exports = {
  protocol2: {
    success: getFixture('protocol2.success.xml'),
    failure: getFixture('protocol2.failure.xml')
  },
  protocol3: {
    success: getFixture('protocol3.success.xml'),
    successWithSingleGroup: getFixture('protocol3.1group.xml'),
    failure: getFixture('protocol2.failure.xml')
  }
}
