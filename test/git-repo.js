import { exec as _exec } from 'child_process'
import { promisify } from 'util'

const exec = promisify(_exec)

class GitRepo {
    constructor(cwd) {
        this.cwd = cwd
    }

    _runCommand(command) {
        return exec(`git ${command}`, { cwd: this.cwd })
    }

    init() {
        return this._runCommand('init')
    }

    commit({ message }) {
        return this._runCommand(`commit -am "${message}"`)
    }

    add(files) {
        return this._runCommand(`add ${files}`)
    }

    tag() {
        return this._runCommand('tag')
    }
}

export default GitRepo
