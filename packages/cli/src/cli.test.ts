import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'

import monodeploy from '@monodeploy/node'

const scriptPath = path.join(__dirname, 'index.ts')

jest.mock('@monodeploy/node', () => ({
    __esModule: true,
    default: jest.fn(),
}))

describe('CLI', () => {
    const origArgs = process.argv

    afterAll(() => {
        process.argv = origArgs
    })

    afterEach(() => {
        // eslint-disable-next-line prettier/prettier
        (monodeploy as jest.MockedFunction<typeof monodeploy>).mockClear();
    })

    const setArgs = (command: string) => {
        process.argv = command ? ['node', scriptPath, ...command.split(' ')] : ['node', scriptPath]
    }

    describe('CLI Args', () => {
        it('passes cli flags to monodeploy', async () => {
            setArgs(
                '--registry-url http://example.com --no-registry --cwd /tmp --dry-run ' +
                    '--git-base-branch main --git-commit-sha HEAD --git-remote origin ' +
                    '--log-level 0 --conventional-changelog-config @my/config ' +
                    '--changeset-filename changes.json --prepend-changelog changelog.md --force-write-change-files ' +
                    '--push --persist-versions --access infer --topological --topological-dev --jobs 6 ' +
                    '--auto-commit --auto-commit-message release --plugins plugin-a --plugins plugin-b ' +
                    '--max-concurrent-reads 3 --max-concurrent-writes 4 --no-git-tag ' +
                    '--changeset-ignore-patterns *.test.js --prerelease --prerelease-id rc --prerelease-npm-tag beta ' +
                    '--commit-ignore-patterns skip-ci --package-group-manifest-field group',
            )
            jest.isolateModules(() => {
                require('./index')
            })
            await new Promise((r) => setTimeout(r))
            expect((monodeploy as jest.MockedFunction<typeof monodeploy>).mock.calls[0][0])
                .toMatchInlineSnapshot(`
                Object {
                  "access": "infer",
                  "autoCommit": true,
                  "autoCommitMessage": "release",
                  "changelogFilename": "changelog.md",
                  "changesetFilename": "changes.json",
                  "changesetIgnorePatterns": Array [
                    "*.test.js",
                  ],
                  "commitIgnorePatterns": Array [
                    "skip-ci",
                  ],
                  "conventionalChangelogConfig": "@my/config",
                  "cwd": "/tmp",
                  "dryRun": true,
                  "forceWriteChangeFiles": true,
                  "git": Object {
                    "baseBranch": "main",
                    "commitSha": "HEAD",
                    "push": true,
                    "remote": "origin",
                    "tag": false,
                  },
                  "jobs": 6,
                  "maxConcurrentReads": 3,
                  "maxConcurrentWrites": 4,
                  "noRegistry": true,
                  "packageGroupManifestField": "group",
                  "persistVersions": true,
                  "plugins": Array [
                    "plugin-a",
                    "plugin-b",
                  ],
                  "prerelease": true,
                  "prereleaseId": "rc",
                  "prereleaseNPMTag": "beta",
                  "registryUrl": "http://example.com",
                  "topological": true,
                  "topologicalDev": true,
                }
            `)
        })

        it('passes empty config if no cli flags set', async () => {
            setArgs('')
            jest.isolateModules(() => {
                require('./index')
            })
            await new Promise((r) => setTimeout(r))
            expect((monodeploy as jest.MockedFunction<typeof monodeploy>).mock.calls[0][0])
                .toMatchInlineSnapshot(`
                Object {
                  "access": undefined,
                  "autoCommit": undefined,
                  "autoCommitMessage": undefined,
                  "changelogFilename": undefined,
                  "changesetFilename": undefined,
                  "changesetIgnorePatterns": undefined,
                  "commitIgnorePatterns": undefined,
                  "conventionalChangelogConfig": undefined,
                  "cwd": undefined,
                  "dryRun": undefined,
                  "forceWriteChangeFiles": undefined,
                  "git": Object {
                    "baseBranch": undefined,
                    "commitSha": undefined,
                    "push": undefined,
                    "remote": undefined,
                    "tag": undefined,
                  },
                  "jobs": 0,
                  "maxConcurrentReads": 0,
                  "maxConcurrentWrites": 0,
                  "noRegistry": undefined,
                  "packageGroupManifestField": undefined,
                  "persistVersions": undefined,
                  "plugins": undefined,
                  "prerelease": undefined,
                  "prereleaseId": undefined,
                  "prereleaseNPMTag": undefined,
                  "registryUrl": undefined,
                  "topological": undefined,
                  "topologicalDev": undefined,
                }
            `)
        })

        it('sets exit code to error if monodeploy throws', async () => {
            const prevExitCode = process.exitCode ?? 0
            const spyError = jest.spyOn(console, 'error').mockImplementation(() => {
                /* ignore */
            })
            const error = new Error('Monodeploy failed.')
            ;(monodeploy as jest.MockedFunction<typeof monodeploy>).mockImplementation(() => {
                throw error
            })
            setArgs('')
            jest.isolateModules(() => {
                require('./index')
            })
            await new Promise((r) => setTimeout(r))
            expect(spyError).toHaveBeenCalledWith(error)
            expect(process.exitCode).toBe(1)
            spyError.mockRestore()
            process.exitCode = prevExitCode
        })
    })

    describe('Config File', () => {
        it('throws an error if unable to read config file', async () => {
            const prevExitCode = process.exitCode ?? 0
            const spyError = jest.spyOn(console, 'error').mockImplementation(() => {
                /* ignore */
            })

            const configFileContents = `
                invalid_javascript{} = {
                    invalid code
            `

            const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'monorepo-'))
            try {
                const configFilename = path.resolve(path.join(dir, 'monodeploy.config.js'))
                await fs.writeFile(configFilename, configFileContents, 'utf-8')
                setArgs(`--config-file ${configFilename}`)
                jest.isolateModules(() => {
                    require('./index')
                })
                await new Promise((r) => setTimeout(r))
                expect(spyError).toHaveBeenCalled()
                expect(process.exitCode).toBe(1)
                spyError.mockRestore()
                process.exitCode = prevExitCode
            } finally {
                await fs.rm(dir, { recursive: true, force: true })
            }
        })

        it('throws an error if invalid configuration', async () => {
            const prevExitCode = process.exitCode ?? 0
            const spyError = jest.spyOn(console, 'error').mockImplementation(() => {
                /* ignore */
            })

            const configFileContents = `
                module.exports = { git: { baseBranch: true } }
            `

            const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'monorepo-'))
            try {
                const configFilename = path.resolve(path.join(dir, 'monodeploy.config.js'))
                await fs.writeFile(configFilename, configFileContents, 'utf-8')
                setArgs(`--config-file ${configFilename}`)
                jest.isolateModules(() => {
                    require('./index')
                })
                await new Promise((r) => setTimeout(r))
                expect(spyError).toHaveBeenCalled()
                expect(process.exitCode).toBe(1)
                spyError.mockRestore()
                process.exitCode = prevExitCode
            } finally {
                await fs.rm(dir, { recursive: true, force: true })
            }
        })

        it('reads from specified config file using absolute path', async () => {
            const configFileContents = `
                module.exports = {
                    access: 'public',
                    changelogFilename: 'from_file.changelog.md',
                    changesetFilename: 'from_file.changes.json',
                    conventionalChangelogConfig: '@my/config-from-file',
                    autoCommit: true,
                    autoCommitMessage: 'chore: release',
                    dryRun: true,
                    forceWriteChangeFiles: true,
                    git: {
                        baseBranch: 'main',
                        commitSha: 'HEAD',
                        push: true,
                        remote: 'origin',
                        tag: true,
                    },
                    jobs: 6,
                    persistVersions: true,
                    registryUrl: 'http://example.com',
                    noRegistry: false,
                    topological: true,
                    topologicalDev: true,
                    maxConcurrentReads: 3,
                    maxConcurrentWrites: 5,
                    plugins: ['plugin-a', 'plugin-b'],
                    prerelease: true,
                    prereleaseId: 'alpha',
                    prereleaseNPMTag: 'beta',
                    commitIgnorePatterns: ['skip-ci'],
                }
            `

            const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'monorepo-'))
            try {
                const configFilename = path.resolve(path.join(dir, 'monodeploy.config.js'))
                await fs.writeFile(configFilename, configFileContents, 'utf-8')
                setArgs(`--config-file ${configFilename}`)
                jest.isolateModules(() => {
                    require('./index')
                })
                await new Promise((r) => setTimeout(r))
                expect((monodeploy as jest.MockedFunction<typeof monodeploy>).mock.calls[0][0])
                    .toMatchInlineSnapshot(`
                    Object {
                      "access": "public",
                      "autoCommit": true,
                      "autoCommitMessage": "chore: release",
                      "changelogFilename": "from_file.changelog.md",
                      "changesetFilename": "from_file.changes.json",
                      "changesetIgnorePatterns": undefined,
                      "commitIgnorePatterns": Array [
                        "skip-ci",
                      ],
                      "conventionalChangelogConfig": "@my/config-from-file",
                      "cwd": undefined,
                      "dryRun": true,
                      "forceWriteChangeFiles": true,
                      "git": Object {
                        "baseBranch": "main",
                        "commitSha": "HEAD",
                        "push": true,
                        "remote": "origin",
                        "tag": true,
                      },
                      "jobs": 6,
                      "maxConcurrentReads": 3,
                      "maxConcurrentWrites": 5,
                      "noRegistry": false,
                      "packageGroupManifestField": undefined,
                      "persistVersions": true,
                      "plugins": Array [
                        "plugin-a",
                        "plugin-b",
                      ],
                      "prerelease": true,
                      "prereleaseId": "alpha",
                      "prereleaseNPMTag": "beta",
                      "registryUrl": "http://example.com",
                      "topological": true,
                      "topologicalDev": true,
                    }
                `)
            } finally {
                await fs.rm(dir, { recursive: true, force: true })
            }
        })

        it('reads from specified config file using path relative to cwd', async () => {
            const configFileContents = `
                module.exports = {
                    access: 'restricted',
                    changelogFilename: 'from_file.changelog.md',
                    changesetFilename: 'from_file.changes.json',
                    conventionalChangelogConfig: {
                        name: '@my/config-from-file',
                        someData: 123,
                    },
                    dryRun: true,
                    forceWriteChangeFiles: true,
                    git: {
                        baseBranch: 'main',
                        commitSha: 'HEAD',
                        push: true,
                        remote: 'origin',
                        tag: false,
                    },
                    jobs: 6,
                    persistVersions: true,
                    registryUrl: 'http://example.com',
                    noRegistry: false,
                    topological: true,
                    topologicalDev: true,
                    maxConcurrentReads: 6,
                    maxConcurrentWrites: 2,
                    prerelease: false,
                    prereleaseNPMTag: 'alpha',
                }
            `

            const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'monorepo-'))
            try {
                const configFilename = path.resolve(path.join(dir, 'monodeploy.config.js'))
                await fs.writeFile(configFilename, configFileContents, 'utf-8')
                setArgs(`--config-file monodeploy.config.js --cwd ${dir}`)
                jest.isolateModules(() => {
                    require('./index')
                })
                await new Promise((r) => setTimeout(r))
                const config = (monodeploy as jest.MockedFunction<typeof monodeploy>).mock
                    .calls[0][0]
                expect({ ...config, cwd: config.cwd ? '/tmp/cwd' : null }).toMatchInlineSnapshot(`
                    Object {
                      "access": "restricted",
                      "autoCommit": undefined,
                      "autoCommitMessage": undefined,
                      "changelogFilename": "from_file.changelog.md",
                      "changesetFilename": "from_file.changes.json",
                      "changesetIgnorePatterns": undefined,
                      "commitIgnorePatterns": undefined,
                      "conventionalChangelogConfig": Object {
                        "name": "@my/config-from-file",
                        "someData": 123,
                      },
                      "cwd": "/tmp/cwd",
                      "dryRun": true,
                      "forceWriteChangeFiles": true,
                      "git": Object {
                        "baseBranch": "main",
                        "commitSha": "HEAD",
                        "push": true,
                        "remote": "origin",
                        "tag": false,
                      },
                      "jobs": 6,
                      "maxConcurrentReads": 6,
                      "maxConcurrentWrites": 2,
                      "noRegistry": false,
                      "packageGroupManifestField": undefined,
                      "persistVersions": true,
                      "plugins": undefined,
                      "prerelease": false,
                      "prereleaseId": undefined,
                      "prereleaseNPMTag": "alpha",
                      "registryUrl": "http://example.com",
                      "topological": true,
                      "topologicalDev": true,
                    }
                `)
            } finally {
                await fs.rm(dir, { recursive: true, force: true })
            }
        })

        it('reads from specified config file using relative path', async () => {
            const configFileContents = `
                module.exports = {
                    access: 'public',
                    changelogFilename: 'from_file.changelog.md',
                    changesetFilename: 'from_file.changes.json',
                    conventionalChangelogConfig: '@my/config-from-file',
                    dryRun: true,
                    forceWriteChangeFiles: true,
                    changesetIgnorePatterns: ['*.test.js', '*.snap'],
                    git: {
                        baseBranch: 'main',
                        commitSha: 'HEAD',
                        push: true,
                        remote: 'origin',
                        tag: false,
                    },
                    jobs: 6,
                    persistVersions: true,
                    registryUrl: 'http://example.com',
                    noRegistry: false,
                    topological: true,
                    topologicalDev: true,
                    maxConcurrentReads: 2,
                    maxConcurrentWrites: 1,
                    packageGroupManifestField: 'group',
                }
            `

            const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'monorepo-'))
            try {
                const configFilename = path.resolve(path.join(dir, 'monodeploy.config.js'))
                await fs.writeFile(configFilename, configFileContents, 'utf-8')
                setArgs(`--config-file ./monodeploy.config.js --cwd ${dir}`)
                jest.isolateModules(() => {
                    require('./index')
                })
                await new Promise((r) => setTimeout(r))
                const config = (monodeploy as jest.MockedFunction<typeof monodeploy>).mock
                    .calls[0][0]
                expect({ ...config, cwd: config.cwd ? '/tmp/cwd' : null }).toMatchInlineSnapshot(`
                    Object {
                      "access": "public",
                      "autoCommit": undefined,
                      "autoCommitMessage": undefined,
                      "changelogFilename": "from_file.changelog.md",
                      "changesetFilename": "from_file.changes.json",
                      "changesetIgnorePatterns": Array [
                        "*.test.js",
                        "*.snap",
                      ],
                      "commitIgnorePatterns": undefined,
                      "conventionalChangelogConfig": "@my/config-from-file",
                      "cwd": "/tmp/cwd",
                      "dryRun": true,
                      "forceWriteChangeFiles": true,
                      "git": Object {
                        "baseBranch": "main",
                        "commitSha": "HEAD",
                        "push": true,
                        "remote": "origin",
                        "tag": false,
                      },
                      "jobs": 6,
                      "maxConcurrentReads": 2,
                      "maxConcurrentWrites": 1,
                      "noRegistry": false,
                      "packageGroupManifestField": "group",
                      "persistVersions": true,
                      "plugins": undefined,
                      "prerelease": undefined,
                      "prereleaseId": undefined,
                      "prereleaseNPMTag": undefined,
                      "registryUrl": "http://example.com",
                      "topological": true,
                      "topologicalDev": true,
                    }
                `)
            } finally {
                await fs.rm(dir, { recursive: true, force: true })
            }
        })

        it('gives precedence to cli flags over config file', async () => {
            const configFileContents = `
            module.exports = {
                access: 'public',
                changelogFilename: 'from_file.changelog.md',
                changesetFilename: 'from_file.changes.json',
                conventionalChangelogConfig: '@my/config-from-file',
                dryRun: true,
                forceWriteChangeFiles: true,
                noRegistry: false,
                autoCommit: true,
                autoCommitMessage: 'chore: release',
                git: {
                    baseBranch: 'main',
                    commitSha: 'HEAD',
                    push: true,
                    remote: 'origin',
                    tag: false,
                },
                jobs: 6,
                persistVersions: true,
                registryUrl: 'http://example.com',
                topological: true,
                topologicalDev: true,
                maxConcurrentReads: 10,
                maxConcurrentWrites: 11,
                prerelease: true,
                prereleaseId: 'beta',
                commitIgnorePatterns: ['skip-ci'],
                packageGroupManifestField: 'group',
            }
        `

            const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'monorepo-'))
            try {
                const configFilename = path.resolve(path.join(dir, 'monodeploy.config.js'))
                await fs.writeFile(configFilename, configFileContents, 'utf-8')
                setArgs(
                    `--config-file ${configFilename} --git-base-branch next --jobs 3 --commit-ignore-patterns ignore-me`,
                )
                jest.isolateModules(() => {
                    require('./index')
                })
                await new Promise((r) => setTimeout(r))
                expect((monodeploy as jest.MockedFunction<typeof monodeploy>).mock.calls[0][0])
                    .toMatchInlineSnapshot(`
                    Object {
                      "access": "public",
                      "autoCommit": true,
                      "autoCommitMessage": "chore: release",
                      "changelogFilename": "from_file.changelog.md",
                      "changesetFilename": "from_file.changes.json",
                      "changesetIgnorePatterns": undefined,
                      "commitIgnorePatterns": Array [
                        "ignore-me",
                      ],
                      "conventionalChangelogConfig": "@my/config-from-file",
                      "cwd": undefined,
                      "dryRun": true,
                      "forceWriteChangeFiles": true,
                      "git": Object {
                        "baseBranch": "next",
                        "commitSha": "HEAD",
                        "push": true,
                        "remote": "origin",
                        "tag": false,
                      },
                      "jobs": 3,
                      "maxConcurrentReads": 10,
                      "maxConcurrentWrites": 11,
                      "noRegistry": false,
                      "packageGroupManifestField": "group",
                      "persistVersions": true,
                      "plugins": undefined,
                      "prerelease": true,
                      "prereleaseId": "beta",
                      "prereleaseNPMTag": undefined,
                      "registryUrl": "http://example.com",
                      "topological": true,
                      "topologicalDev": true,
                    }
                `)
            } finally {
                await fs.rm(dir, { recursive: true, force: true })
            }
        })

        it('gives precedence to cli flags over config file with negated flags', async () => {
            const configFileContents = `
            module.exports = {
                access: 'public',
                changelogFilename: 'from_file.changelog.md',
                changesetFilename: 'from_file.changes.json',
                conventionalChangelogConfig: '@my/config-from-file',
                dryRun: true,
                forceWriteChangeFiles: true,
                noRegistry: false,
                autoCommit: true,
                autoCommitMessage: 'chore: release',
                git: {
                    baseBranch: 'main',
                    commitSha: 'HEAD',
                    push: true,
                    remote: 'origin',
                    tag: false,
                },
                jobs: 6,
                persistVersions: true,
                registryUrl: 'http://example.com',
                topological: true,
                topologicalDev: true,
                maxConcurrentReads: 10,
                maxConcurrentWrites: 11,
                prerelease: true,
                prereleaseId: 'beta',
            }
        `

            const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'monorepo-'))
            try {
                const configFilename = path.resolve(path.join(dir, 'monodeploy.config.js'))
                await fs.writeFile(configFilename, configFileContents, 'utf-8')
                setArgs(
                    `--config-file ${configFilename} --git-base-branch next --jobs 3 --no-prerelease ` +
                        '--no-topological --no-topological-dev --no-persist-versions',
                )
                jest.isolateModules(() => {
                    require('./index')
                })
                await new Promise((r) => setTimeout(r))
                expect((monodeploy as jest.MockedFunction<typeof monodeploy>).mock.calls[0][0])
                    .toMatchInlineSnapshot(`
                    Object {
                      "access": "public",
                      "autoCommit": true,
                      "autoCommitMessage": "chore: release",
                      "changelogFilename": "from_file.changelog.md",
                      "changesetFilename": "from_file.changes.json",
                      "changesetIgnorePatterns": undefined,
                      "commitIgnorePatterns": undefined,
                      "conventionalChangelogConfig": "@my/config-from-file",
                      "cwd": undefined,
                      "dryRun": true,
                      "forceWriteChangeFiles": true,
                      "git": Object {
                        "baseBranch": "next",
                        "commitSha": "HEAD",
                        "push": true,
                        "remote": "origin",
                        "tag": false,
                      },
                      "jobs": 3,
                      "maxConcurrentReads": 10,
                      "maxConcurrentWrites": 11,
                      "noRegistry": false,
                      "packageGroupManifestField": undefined,
                      "persistVersions": false,
                      "plugins": undefined,
                      "prerelease": false,
                      "prereleaseId": "beta",
                      "prereleaseNPMTag": undefined,
                      "registryUrl": "http://example.com",
                      "topological": false,
                      "topologicalDev": false,
                    }
                `)
            } finally {
                await fs.rm(dir, { recursive: true, force: true })
            }
        })
    })
})
