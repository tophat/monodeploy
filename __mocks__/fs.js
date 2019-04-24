import { fs } from 'memfs'

// This needs to be module.exports, not export default, in order to mock fs properly
module.exports = fs
