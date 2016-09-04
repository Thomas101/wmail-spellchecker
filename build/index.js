const fs = require('fs-extra')
const path = require('path')
const fetch = require('node-fetch')
const request = require('request')
const child_process = require('child_process')

const SCRATCH_PATH = path.resolve('./build/scratch')
const NATIVE_PATH = path.resolve('./native')
const NATIVE_RELEASES = 'https://api.github.com/repos/Thomas101/nodehun/releases'
const NAME_RE = RegExp(/-(darwin|linux|win32)-(x64|ia32)*?$/)

/**
* Logging util that returns a resolved promise
* @arguments: arguments to log
* @return resolved promise
*/
const plog = function () {
  console.log.apply(this, Array.from(arguments))
  return Promise.resolve()
}

/**
* Cleans up the scratch path
*/
const cleanScratch = function () {
  try { fs.removeSync(SCRATCH_PATH) } catch (ex) { console.log('a', ex) }
  try { fs.mkdirSync(SCRATCH_PATH) } catch (ex) { console.log('b', ex) }
}

/**
* Cleans up the native path
*/
const cleanNative = function () {
  try { fs.removeSync(NATIVE_PATH) } catch (ex) { }
  try { fs.mkdirSync(NATIVE_PATH) } catch (ex) { }
}

/**
* Fetches the latest release
* @return promise with binary urls
*/
const fetchBinaryUrls = function () {
  return Promise.resolve()
    // Fetch the latest release
    .then(() => plog('Fetching releases info'))
    .then(() => fetch(NATIVE_RELEASES))
    .then((res) => res.ok ? Promise.resolve(res) : Promise.reject(res))
    .then((res) => res.json())
    .then((res) => {
      const urls = res[0].assets.map((asset) => asset.browser_download_url)
      return Promise.resolve(urls)
    })
}

/**
* Fetches a binary
* @param url: the url to fetch from
* @return promise
*/
const fetchBinary = function (url) {
  const tarName = path.basename(url)
  const name = path.basename(tarName, '.tar.gz')
  const [_, platform, arch] = NAME_RE.exec(name)

  const tarPath = path.join(SCRATCH_PATH, tarName)
  const untarPath = path.join(SCRATCH_PATH, name)
  const nativePath = path.join(NATIVE_PATH, platform + '_' + arch)

  return Promise.resolve()
    .then(() => plog('------ ' + name + ' ------'))
    .then(() => { cleanScratch(); return Promise.resolve() })
    .then(() => plog('Fetching binary', tarName))
    .then(() => {
      return new Promise((resolve, reject) => {
        request(url)
          .pipe(fs.createWriteStream(tarPath))
          .on('finish', () => { resolve(tarPath) })
          .on('error', (err) => { reject(err) })
      })
    })
    .then(() => plog('Extracting binary'))
    .then(() => {
      return new Promise((resolve, reject) => {
        fs.mkdirSync(untarPath)
        child_process.exec(`tar -zxf ${tarPath} -C ${untarPath}`, (err) => {
          err ? reject(err) : resolve()
        })
      })
    })
    .then(() => {
      return new Promise((resolve, reject) => {
        child_process.exec(`chmod -R 755 ${untarPath}`, (err) => {
          err ? reject(err) : resolve()
        })
      })
    })
    .then(() => plog('Copying binary'))
    .then(() => {
      fs.copySync(path.join(untarPath, 'Release'), nativePath)
      return plog('Done')
    })
}

/**
* Fetches all the binaries
* @param urls: the urls to fetch from
* @return promise
*/
const fetchBinaries = function (urls) {
  return urls.reduce((acc, url) => {
    return acc.then(() => fetchBinary(url))
  }, Promise.resolve())
}


cleanScratch()
cleanNative()
Promise.resolve()
  .then(() => fetchBinaryUrls())
  .then((urls) => fetchBinaries(urls))
  //.then((urls) => fetchBinary(urls[3]))
  .then(() => { cleanScratch(); return Promise.resolve() })
  .then(() => console.log('Complete'), (err) => console.error(err))
