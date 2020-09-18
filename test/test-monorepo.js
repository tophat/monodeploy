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

    async getTags() {
        const { stdout: tags } = await this.gitRepo.tag()
        return tags.trim().split('\n')
    }

    async deleteTags() {
        const tags = await this.getTags()
        if (tags.length === 0) {
            return
        }
        return this.gitRepo.tag(['-d'].concat(tags))
    }

    async resetChanges() {
        await this.gitRepo.checkout(['.'])
        await this.gitRepo.clean()
    }
}

export default TestMonorepo
