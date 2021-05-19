import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'

import monodeploy from '@monodeploy/node'

const scriptPath = path.join(__dirname, 'cli.ts')

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
        process.argv = command
            ? ['node', scriptPath, ...command.split(' ')]
            : ['node', scriptPath]
    }

    describe('CLI Args', () => {
        it('passes cli flags to monodeploy', async () => {
            setArgs(
                '--registry-url http://example.com --no-registry --cwd /tmp --dry-run ' +
                    '--git-base-branch master --git-commit-sha HEAD --git-remote origin ' +
                    '--log-level 0 --conventional-changelog-config @my/config ' +
                    '--changeset-filename changes.json --prepend-changelog changelog.md --force-write-change-files ' +
                    '--push --persist-versions --access public --topological --topological-dev --jobs 6 ' +
                    '--auto-commit --auto-commit-message release --plugins plugin-a plugin-b ' +
                    '--max-concurrent-reads 3 --max-concurrent-writes 4 --no-git-tag',
            )
            jest.isolateModules(() => {
                require('./cli')
            })
            await new Promise(r => setTimeout(r))
            expect(
                (monodeploy as jest.MockedFunction<typeof monodeploy>).mock
                    .calls[0][0],
            ).toMatchInlineSnapshot(`
                Object {
                  "access": "public",
                  "autoCommit": true,
                  "autoCommitMessage": "release",
                  "changelogFilename": "changelog.md",
                  "changesetFilename": "changes.json",
                  "conventionalChangelogConfig": "@my/config",
                  "cwd": "/tmp",
                  "dryRun": true,
                  "forceWriteChangeFiles": true,
                  "git": Object {
                    "baseBranch": "master",
                    "commitSha": "HEAD",
                    "push": true,
                    "remote": "origin",
                    "tag": false,
                  },
                  "jobs": 6,
                  "maxConcurrentReads": 3,
                  "maxConcurrentWrites": 4,
                  "noRegistry": true,
                  "persistVersions": true,
                  "plugins": Array [
                    "plugin-a",
                    "plugin-b",
                  ],
                  "registryUrl": "http://example.com",
                  "topological": true,
                  "topologicalDev": true,
                }
            `)
        })

        it('passes empty config if no cli flags set', async () => {
            setArgs('')
            jest.isolateModules(() => {
                require('./cli')
            })
            await new Promise(r => setTimeout(r))
            expect(
                (monodeploy as jest.MockedFunction<typeof monodeploy>).mock
                    .calls[0][0],
            ).toMatchInlineSnapshot(`
                Object {
                  "access": undefined,
                  "autoCommit": undefined,
                  "autoCommitMessage": undefined,
                  "changelogFilename": undefined,
                  "changesetFilename": undefined,
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
                  "persistVersions": undefined,
                  "plugins": undefined,
                  "registryUrl": undefined,
                  "topological": undefined,
                  "topologicalDev": undefined,
                }
            `)
        })

        it('sets exit code to error if monodeploy throws', async () => {
            const prevExitCode = process.exitCode ?? 0
            const spyError = jest
                .spyOn(console, 'error')
                .mockImplementation(() => {
                    /* ignore */
                })
            const error = new Error('Monodeploy failed.')
            ;(monodeploy as jest.MockedFunction<
                typeof monodeploy
            >).mockImplementation(() => {
                throw error
            })
            setArgs('')
            jest.isolateModules(() => {
                require('./cli')
            })
            await new Promise(r => setTimeout(r))
            expect(spyError).toHaveBeenCalledWith(error)
            expect(process.exitCode).toEqual(1)
            spyError.mockRestore()
            process.exitCode = prevExitCode
        })
    })

    describe('Config File', () => {
        it('throws an error if unable to read config file', async () => {
            const prevExitCode = process.exitCode ?? 0
            const spyError = jest
                .spyOn(console, 'error')
                .mockImplementation(() => {
                    /* ignore */
                })

            const configFileContents = `
                invalid_javascript{} = {
                    invalid code
            `

            const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'monorepo-'))
            try {
                const configFilename = path.resolve(
                    path.join(dir, 'monodeploy.config.js'),
                )
                await fs.writeFile(configFilename, configFileContents, 'utf-8')
                setArgs(`--config-file ${configFilename}`)
                jest.isolateModules(() => {
                    require('./cli')
                })
                await new Promise(r => setTimeout(r))
                expect(spyError).toHaveBeenCalled()
                expect(process.exitCode).toEqual(1)
                spyError.mockRestore()
                process.exitCode = prevExitCode
            } finally {
                await fs.rm(dir, { recursive: true, force: true })
            }
        })

        it('throws an error if invalid configuration', async () => {
            const prevExitCode = process.exitCode ?? 0
            const spyError = jest
                .spyOn(console, 'error')
                .mockImplementation(() => {
                    /* ignore */
                })

            const configFileContents = `
                module.exports = { git: { baseBranch: true } }
            `

            const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'monorepo-'))
            try {
                const configFilename = path.resolve(
                    path.join(dir, 'monodeploy.config.js'),
                )
                await fs.writeFile(configFilename, configFileContents, 'utf-8')
                setArgs(`--config-file ${configFilename}`)
                jest.isolateModules(() => {
                    require('./cli')
                })
                await new Promise(r => setTimeout(r))
                expect(spyError).toHaveBeenCalled()
                expect(process.exitCode).toEqual(1)
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
                        baseBranch: 'master',
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
                }
            `

            const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'monorepo-'))
            try {
                const configFilename = path.resolve(
                    path.join(dir, 'monodeploy.config.js'),
                )
                await fs.writeFile(configFilename, configFileContents, 'utf-8')
                setArgs(`--config-file ${configFilename}`)
                jest.isolateModules(() => {
                    require('./cli')
                })
                await new Promise(r => setTimeout(r))
                expect(
                    (monodeploy as jest.MockedFunction<typeof monodeploy>).mock
                        .calls[0][0],
                ).toMatchInlineSnapshot(`
                    Object {
                      "access": "public",
                      "autoCommit": true,
                      "autoCommitMessage": "chore: release",
                      "changelogFilename": "from_file.changelog.md",
                      "changesetFilename": "from_file.changes.json",
                      "conventionalChangelogConfig": "@my/config-from-file",
                      "cwd": undefined,
                      "dryRun": true,
                      "forceWriteChangeFiles": true,
                      "git": Object {
                        "baseBranch": "master",
                        "commitSha": "HEAD",
                        "push": true,
                        "remote": "origin",
                        "tag": true,
                      },
                      "jobs": 6,
                      "maxConcurrentReads": 3,
                      "maxConcurrentWrites": 5,
                      "noRegistry": false,
                      "persistVersions": true,
                      "plugins": Array [
                        "plugin-a",
                        "plugin-b",
                      ],
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
                    access: 'public',
                    changelogFilename: 'from_file.changelog.md',
                    changesetFilename: 'from_file.changes.json',
                    conventionalChangelogConfig: '@my/config-from-file',
                    dryRun: true,
                    forceWriteChangeFiles: true,
                    git: {
                        baseBranch: 'master',
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
                }
            `

            const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'monorepo-'))
            try {
                const configFilename = path.resolve(
                    path.join(dir, 'monodeploy.config.js'),
                )
                await fs.writeFile(configFilename, configFileContents, 'utf-8')
                setArgs(`--config-file monodeploy.config.js --cwd ${dir}`)
                jest.isolateModules(() => {
                    require('./cli')
                })
                await new Promise(r => setTimeout(r))
                const config = (monodeploy as jest.MockedFunction<
                    typeof monodeploy
                >).mock.calls[0][0]
                expect({ ...config, cwd: config.cwd ? '/tmp/cwd' : null })
                    .toMatchInlineSnapshot(`
                    Object {
                      "access": "public",
                      "autoCommit": undefined,
                      "autoCommitMessage": undefined,
                      "changelogFilename": "from_file.changelog.md",
                      "changesetFilename": "from_file.changes.json",
                      "conventionalChangelogConfig": "@my/config-from-file",
                      "cwd": "/tmp/cwd",
                      "dryRun": true,
                      "forceWriteChangeFiles": true,
                      "git": Object {
                        "baseBranch": "master",
                        "commitSha": "HEAD",
                        "push": true,
                        "remote": "origin",
                        "tag": false,
                      },
                      "jobs": 6,
                      "maxConcurrentReads": 6,
                      "maxConcurrentWrites": 2,
                      "noRegistry": false,
                      "persistVersions": true,
                      "plugins": undefined,
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
                    git: {
                        baseBranch: 'master',
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
                }
            `

            const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'monorepo-'))
            try {
                const configFilename = path.resolve(
                    path.join(dir, 'monodeploy.config.js'),
                )
                await fs.writeFile(configFilename, configFileContents, 'utf-8')
                setArgs(`--config-file ./monodeploy.config.js --cwd ${dir}`)
                jest.isolateModules(() => {
                    require('./cli')
                })
                await new Promise(r => setTimeout(r))
                const config = (monodeploy as jest.MockedFunction<
                    typeof monodeploy
                >).mock.calls[0][0]
                expect({ ...config, cwd: config.cwd ? '/tmp/cwd' : null })
                    .toMatchInlineSnapshot(`
                    Object {
                      "access": "public",
                      "autoCommit": undefined,
                      "autoCommitMessage": undefined,
                      "changelogFilename": "from_file.changelog.md",
                      "changesetFilename": "from_file.changes.json",
                      "conventionalChangelogConfig": "@my/config-from-file",
                      "cwd": "/tmp/cwd",
                      "dryRun": true,
                      "forceWriteChangeFiles": true,
                      "git": Object {
                        "baseBranch": "master",
                        "commitSha": "HEAD",
                        "push": true,
                        "remote": "origin",
                        "tag": false,
                      },
                      "jobs": 6,
                      "maxConcurrentReads": 2,
                      "maxConcurrentWrites": 1,
                      "noRegistry": false,
                      "persistVersions": true,
                      "plugins": undefined,
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
                    baseBranch: 'master',
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
            }
        `

            const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'monorepo-'))
            try {
                const configFilename = path.resolve(
                    path.join(dir, 'monodeploy.config.js'),
                )
                await fs.writeFile(configFilename, configFileContents, 'utf-8')
                setArgs(
                    `--config-file ${configFilename} --git-base-branch next --jobs 3`,
                )
                jest.isolateModules(() => {
                    require('./cli')
                })
                await new Promise(r => setTimeout(r))
                expect(
                    (monodeploy as jest.MockedFunction<typeof monodeploy>).mock
                        .calls[0][0],
                ).toMatchInlineSnapshot(`
                    Object {
                      "access": "public",
                      "autoCommit": true,
                      "autoCommitMessage": "chore: release",
                      "changelogFilename": "from_file.changelog.md",
                      "changesetFilename": "from_file.changes.json",
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
                      "persistVersions": true,
                      "plugins": undefined,
                      "registryUrl": "http://example.com",
                      "topological": true,
                      "topologicalDev": true,
                    }
                `)
            } finally {
                await fs.rm(dir, { recursive: true, force: true })
            }
        })
    })
})
