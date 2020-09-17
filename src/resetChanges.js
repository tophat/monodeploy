const { exec: _exec } = require('child_process')
const { promisify } = require('util')

const exec = promisify(_exec)

function resetChanges(cwd) {
    return exec('git checkout -- . && git clean -f', { cwd })
}

module.exports = resetChanges
