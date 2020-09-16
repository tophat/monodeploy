import { promisify } from 'util'
import { promises as fs, mkdtempSync } from 'fs'
import path from 'path'

import _rimraf from 'rimraf'

import GitRepo from './git-repo'

const rimraf = promisify(_rimraf)

class TestMonorepo {
    constructor({ packages } = {}) {
        this.dependencyGraph = packages
        this.directoryPath = mkdtempSync(
            path.join(path.sep, 'tmp', 'monodeploy-'),
        )
        this.gitRepo = new GitRepo(this.getPath())
    }

    async init(lernaConfig = {}) {
        this.addFile(
            'lerna.json',
            JSON.stringify({
                packages: ['packages/*'],
                version: 'independent',
                ...lernaConfig,
            }),
        )
        await this.addFile(
            'package.json',
            JSON.stringify({
                private: true,
                version: '1.0.0',
                name: 'monorepo',
            }),
        )
        await this.addDirectory('packages')
        await Promise.all(
            Object.entries(this.dependencyGraph).map(
                ([packageName, dependencies]) => {
                    return this.createPackage(packageName, dependencies)
                },
            ),
        )
        await this.gitRepo.init()
        await this.commitChanges({ message: 'Initial commit' })
    }

    addFile(name, contents) {
        return fs.writeFile(path.join(this.getPath(), name), contents)
    }

    addFileToPackage(packageName, filename, contents) {
        this.addFile(path.join('packages', packageName, filename), contents)
    }

    addDirectory(name) {
        return fs.mkdir(path.join(this.getPath(), name))
    }

    async createPackage(name, dependencies) {
        await this.addDirectory(path.join('packages', name))
        await this.addFileToPackage(
            name,
            'package.json',
            JSON.stringify({
                version: '0.0.0',
                name,
                dependencies: dependencies.reduce(
                    (dependencyMap, dependency) => ({
                        ...dependencyMap,
                        [dependency]: '*',
                    }),
                    {},
                ),
            }),
        )
    }

    getPackageJSON(name) {
        return fs.readFile(
            path.join(this.getPath(), 'packages', name, 'package.json'),
            'utf-8',
        )
    }

    async commitChanges({ message }) {
        await this.gitRepo.add('.')
        await this.gitRepo.commit({ message })
    }

    delete() {
        return rimraf(this.getPath())
    }

    getPath() {
        return this.directoryPath
    }
}

export default TestMonorepo
