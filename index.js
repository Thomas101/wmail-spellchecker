let nodehun
if (process.platform === 'darwin') {
  nodehun = require('./native/darwin_x64/nodehun.node')
} else if (process.platform === 'linux') {
  if (process.arch === 'x64') {
    nodehun = require('./native/linux_x64/nodehun.node')
  } else if (process.arch === 'ia32') {
    nodehun = require('./native/linux_ia32/nodehun.node')
  }
} else if (process.platform === 'win32') {
  if (process.arch === 'x64') {
    nodehun = require('./native/win32_x64/nodehun.node')
  } else if (process.arch === 'ia32') {
    nodehun = require('./native/win32_ia32/nodehun.node')
  }
}

if (nodehun) {
  module.exports = nodehun
} else {
  throw new Error('Precompiled binary not available for ' + process.platform + ' ' + process.arch)
}
