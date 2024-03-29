import { promises as fs } from 'fs'
import path from 'path'

import monodeploy from '@monodeploy/node'
import { createTempDir } from '@monodeploy/test-utils'

const scriptPath = path.join(__dirname, 'index.ts')

jest.mock('@monodeploy/node', () => ({
    __esModule: true,
    default: jest.fn(),
}))

describe('CLI', () => {
    const origArgs = process.argv

    beforeAll(() => {
        process.env.MONODEPLOY_SUPPRESS_EXIT_CODE = '1'
    })

    afterAll(() => {
        process.argv = origArgs
    })

    afterEach(() => {
        // eslint-disable-next-line prettier/prettier
        (monodeploy as jest.MockedFunction<typeof monodeploy>).mockClear();
        process.env.MONODEPLOY_DISABLE_LOGS = '1'
    })

    const setArgs = (command: string) => {
        process.argv = command ? ['node', scriptPath, ...command.split(' ')] : ['node', scriptPath]
    }

    describe('CLI Args', () => {
        it('passes cli flags to monodeploy', async () => {
            setArgs(
                '--registry-url http://example.com --cwd /tmp --dry-run ' +
                    '--git-base-branch main --git-commit-sha HEAD --git-remote origin ' +
                    '--log-level 0 --conventional-changelog-config @my/config ' +
                    '--changeset-filename changes.json --changelog-filename changelog.md --force-write-change-files ' +
                    '--push --persist-versions --access infer --topological --topological-dev --jobs 6 ' +
                    '--auto-commit --auto-commit-message release --plugins plugin-a --plugins plugin-b ' +
                    '--max-concurrent-reads 3 --max-concurrent-writes 4 --no-git-tag --registry-mode npm ' +
                    '--changeset-ignore-patterns *.test.js --prerelease --prerelease-id rc --prerelease-npm-tag beta ' +
                    '--commit-ignore-patterns skip-ci --package-group-manifest-field group --apply-changeset ' +
                    '--minimum-version-strategy minor',
            )
            jest.isolateModules(() => {
                require('./index')
            })
            await new Promise((r) => setTimeout(r))
            expect(
                (monodeploy as jest.MockedFunction<typeof monodeploy>).mock.calls[0][0],
            ).toMatchSnapshot()
        })

        it('passes empty config if no cli flags set', async () => {
            setArgs('')
            jest.isolateModules(() => {
                require('./index')
            })
            await new Promise((r) => setTimeout(r))
            expect(
                (monodeploy as jest.MockedFunction<typeof monodeploy>).mock.calls[0][0],
            ).toMatchSnapshot()
        })

        it('sets exit code to error if monodeploy throws', async () => {
            delete process.env.MONODEPLOY_DISABLE_LOGS
            const spyError = jest.spyOn(process.stderr, 'write').mockImplementation()
            const error = new Error('Monodeploy failed.')
            ;(monodeploy as jest.MockedFunction<typeof monodeploy>).mockImplementation(() => {
                throw error
            })
            setArgs('')

            jest.isolateModules(() => {
                require('./index')
            })

            await new Promise((r) => setTimeout(r))
            expect(spyError).toHaveBeenCalledWith(`${String(error)}\n`)
        })
    })

    describe('Config File', () => {
        it('throws an error if unable to read config file', async () => {
            delete process.env.MONODEPLOY_DISABLE_LOGS
            const spyError = jest.spyOn(process.stderr, 'write').mockImplementation()

            const configFileContents = `
                invalid_javascript{} = {
                    invalid code
            `

            await using tmpDir = await createTempDir()
            const configFilename = path.resolve(path.join(tmpDir.dir, 'monodeploy.config.js'))
            await fs.writeFile(configFilename, configFileContents, 'utf-8')
            setArgs(`--config-file ${configFilename}`)
            jest.isolateModules(() => {
                require('./index')
            })
            await new Promise((r) => setTimeout(r))
            expect(spyError).toHaveBeenCalled()
        })

        it('throws an error if invalid configuration', async () => {
            delete process.env.MONODEPLOY_DISABLE_LOGS
            const spyError = jest.spyOn(process.stderr, 'write').mockImplementation()

            const configFileContents = `
                module.exports = { git: { baseBranch: true } }
            `

            await using tmpDir = await createTempDir()
            const configFilename = path.resolve(path.join(tmpDir.dir, 'monodeploy.config.js'))
            await fs.writeFile(configFilename, configFileContents, 'utf-8')
            setArgs(`--config-file ${configFilename}`)
            jest.isolateModules(() => {
                require('./index')
            })
            await new Promise((r) => setTimeout(r))
            expect(spyError).toHaveBeenCalled()
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
                    registryMode: 'manifest',
                    topological: true,
                    topologicalDev: true,
                    maxConcurrentReads: 3,
                    maxConcurrentWrites: 5,
                    plugins: ['plugin-a', 'plugin-b'],
                    prerelease: true,
                    prereleaseId: 'alpha',
                    prereleaseNPMTag: 'beta',
                    commitIgnorePatterns: ['skip-ci'],
                    packageGroups: { 'pkg-1': { registryMode: 'npm' }, 'pkg-2': { registryMode: 'manifest' } },
                    versionStrategy: {
                        minimumStrategy: 'minor',
                    },
                }
            `

            await using tmpDir = await createTempDir()
            const configFilename = path.resolve(path.join(tmpDir.dir, 'monodeploy.config.js'))
            await fs.writeFile(configFilename, configFileContents, 'utf-8')
            setArgs(`--config-file ${configFilename}`)
            jest.isolateModules(() => {
                require('./index')
            })
            await new Promise((r) => setTimeout(r))
            expect(
                (monodeploy as jest.MockedFunction<typeof monodeploy>).mock.calls[0][0],
            ).toMatchSnapshot()
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
                    topological: true,
                    topologicalDev: true,
                    maxConcurrentReads: 6,
                    maxConcurrentWrites: 2,
                    prerelease: false,
                    prereleaseNPMTag: 'alpha',
                }
            `

            await using tmpDir = await createTempDir()
            const configFilename = path.resolve(path.join(tmpDir.dir, 'monodeploy.config.js'))
            await fs.writeFile(configFilename, configFileContents, 'utf-8')
            setArgs(`--config-file monodeploy.config.js --cwd ${tmpDir.dir}`)
            jest.isolateModules(() => {
                require('./index')
            })
            await new Promise((r) => setTimeout(r))
            const config = (monodeploy as jest.MockedFunction<typeof monodeploy>).mock.calls[0][0]
            expect({ ...config, cwd: config.cwd ? '/tmp/cwd' : null }).toMatchSnapshot()
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
                    topological: true,
                    topologicalDev: true,
                    maxConcurrentReads: 2,
                    maxConcurrentWrites: 1,
                    packageGroupManifestField: 'group',
                }
            `

            await using tmpDir = await createTempDir()
            const configFilename = path.resolve(path.join(tmpDir.dir, 'monodeploy.config.js'))
            await fs.writeFile(configFilename, configFileContents, 'utf-8')
            setArgs(`--config-file ./monodeploy.config.js --cwd ${tmpDir.dir}`)
            jest.isolateModules(() => {
                require('./index')
            })
            await new Promise((r) => setTimeout(r))
            const config = (monodeploy as jest.MockedFunction<typeof monodeploy>).mock.calls[0][0]
            expect({ ...config, cwd: config.cwd ? '/tmp/cwd' : null }).toMatchSnapshot()
        })

        it('reads from monodeploy.config.js by default if it exists', async () => {
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
                    registryMode: 'npm',
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

            await using tmpDir = await createTempDir()
            const configFilename = path.resolve(path.join(tmpDir.dir, 'monodeploy.config.js'))
            await fs.writeFile(configFilename, configFileContents, 'utf-8')
            setArgs(`--cwd ${tmpDir.dir}`)
            jest.isolateModules(() => {
                require('./index')
            })
            await new Promise((r) => setTimeout(r))
            const config = (monodeploy as jest.MockedFunction<typeof monodeploy>).mock.calls[0][0]
            expect({ ...config, cwd: config.cwd ? '/tmp/cwd' : null }).toMatchSnapshot()
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
                changesetIgnorePatterns: ['*.test.js', '*.snap'],
            }
        `

            await using tmpDir = await createTempDir()
            const configFilename = path.resolve(path.join(tmpDir.dir, 'monodeploy.config.js'))
            await fs.writeFile(configFilename, configFileContents, 'utf-8')
            setArgs(
                `--config-file ${configFilename} --git-base-branch next --jobs 3 --commit-ignore-patterns ignore-me --plugins plugin-a`,
            )
            jest.isolateModules(() => {
                require('./index')
            })
            await new Promise((r) => setTimeout(r))
            expect(
                (monodeploy as jest.MockedFunction<typeof monodeploy>).mock.calls[0][0],
            ).toMatchSnapshot()
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
                changesetIgnorePatterns: ['*.test.js', '*.snap'],
            }
        `

            await using tmpDir = await createTempDir()
            const configFilename = path.resolve(path.join(tmpDir.dir, 'monodeploy.config.js'))
            await fs.writeFile(configFilename, configFileContents, 'utf-8')
            setArgs(
                `--config-file ${configFilename} --git-base-branch next --jobs 3 --no-prerelease ` +
                    '--no-topological --no-topological-dev --no-persist-versions --no-changeset-ignore-patterns',
            )
            jest.isolateModules(() => {
                require('./index')
            })
            await new Promise((r) => setTimeout(r))
            expect(
                (monodeploy as jest.MockedFunction<typeof monodeploy>).mock.calls[0][0],
            ).toMatchSnapshot()
        })
    })

    describe('Presets', () => {
        it('throws an error if unable to read the preset file', async () => {
            delete process.env.MONODEPLOY_DISABLE_LOGS
            const spyError = jest.spyOn(process.stderr, 'write').mockImplementation()

            const configFileContents = `
                module.exports = { preset: './preset.js', git: { baseBranch: 'main' } }
            `

            const presetFileContents = `
                invalid_javascript{} = {
                    invalid code
            `

            await using tmpDir = await createTempDir()
            const presetFilename = path.resolve(path.join(tmpDir.dir, 'preset.js'))
            await fs.writeFile(presetFilename, presetFileContents, 'utf-8')

            const configFilename = path.resolve(path.join(tmpDir.dir, 'monodeploy.config.js'))
            await fs.writeFile(configFilename, configFileContents, 'utf-8')
            setArgs(`--config-file ${configFilename}`)
            jest.isolateModules(() => {
                require('./index')
            })
            await new Promise((r) => setTimeout(r))
            expect(spyError).toHaveBeenCalled()
        })

        it('throws an error if invalid configuration', async () => {
            delete process.env.MONODEPLOY_DISABLE_LOGS
            const spyError = jest.spyOn(process.stderr, 'write').mockImplementation()

            const configFileContents = `
                module.exports = { preset: './preset.js', git: { baseBranch: true } }
            `

            const presetFileContents = `
                module.exports = { git: { baseBranch: true } }
            `

            await using tmpDir = await createTempDir()
            const presetFilename = path.resolve(path.join(tmpDir.dir, 'preset.js'))
            await fs.writeFile(presetFilename, presetFileContents, 'utf-8')

            const configFilename = path.resolve(path.join(tmpDir.dir, 'monodeploy.config.js'))
            await fs.writeFile(configFilename, configFileContents, 'utf-8')
            setArgs(`--config-file ${configFilename}`)
            jest.isolateModules(() => {
                require('./index')
            })
            await new Promise((r) => setTimeout(r))
            expect(spyError).toHaveBeenCalled()
        })

        it('merges preset with overrides, defined in config file', async () => {
            const presetFileContents = `
                module.exports = {
                    access: 'public',
                    changelogFilename: 'from_file.changelog.md',
                    changesetFilename: 'from_file.changes.json',
                    conventionalChangelogConfig: '@my/config-from-file',
                    dryRun: true,
                    forceWriteChangeFiles: true,
                    changesetIgnorePatterns: ['*.test.js', '*.snap'],
                    git: {
                        baseBranch: 'main-1',
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
                    maxConcurrentReads: 2,
                    maxConcurrentWrites: 1,
                    packageGroupManifestField: 'group',
                }
            `

            const configFileContents = `
                module.exports = {
                    preset: './some-preset.js',
                    access: 'infer',
                    changesetIgnorePatterns: ['*.snap'],
                    git: {
                        push: false,
                        remote: 'upstream',
                    },
                    jobs: 2,
                    maxConcurrentReads: 0,
                }
            `

            await using tmpDir = await createTempDir()
            const presetFilename = path.resolve(path.join(tmpDir.dir, 'some-preset.js'))
            await fs.writeFile(presetFilename, presetFileContents, 'utf-8')
            const configFilename = path.resolve(path.join(tmpDir.dir, 'monodeploy.config.js'))
            await fs.writeFile(configFilename, configFileContents, 'utf-8')
            setArgs(`--config-file ./monodeploy.config.js --cwd ${tmpDir.dir}`)
            jest.isolateModules(() => {
                require('./index')
            })
            await new Promise((r) => setTimeout(r))
            const config = (monodeploy as jest.MockedFunction<typeof monodeploy>).mock.calls[0][0]
            expect({ ...config, cwd: config.cwd ? '/tmp/cwd' : null }).toMatchSnapshot()
        })

        it('merges preset with overrides, with preset passed as cli arg', async () => {
            const presetFileContents = `
                module.exports = {
                    access: 'public',
                    changelogFilename: 'from_file.changelog.md',
                    changesetFilename: 'from_file.changes.json',
                    conventionalChangelogConfig: '@my/config-from-file',
                    dryRun: true,
                    forceWriteChangeFiles: true,
                    changesetIgnorePatterns: ['*.test.js', '*.snap'],
                    git: {
                        baseBranch: 'main-1',
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
                    maxConcurrentReads: 2,
                    maxConcurrentWrites: 1,
                    packageGroupManifestField: 'group',
                }
            `

            const configFileContents = `
                module.exports = {
                    access: 'infer',
                    changesetIgnorePatterns: ['*.snap'],
                    git: {
                        push: false,
                        remote: 'upstream',
                    },
                    jobs: 2,
                    maxConcurrentReads: 0,
                }
            `

            await using tmpDir = await createTempDir()
            const presetFilename = path.resolve(path.join(tmpDir.dir, 'some-preset.js'))
            await fs.writeFile(presetFilename, presetFileContents, 'utf-8')
            const configFilename = path.resolve(path.join(tmpDir.dir, 'monodeploy.config.js'))
            await fs.writeFile(configFilename, configFileContents, 'utf-8')
            setArgs(
                `--config-file ./monodeploy.config.js --preset ./some-preset.js --cwd ${tmpDir.dir}`,
            )
            jest.isolateModules(() => {
                require('./index')
            })
            await new Promise((r) => setTimeout(r))
            const config = (monodeploy as jest.MockedFunction<typeof monodeploy>).mock.calls[0][0]
            expect({ ...config, cwd: config.cwd ? '/tmp/cwd' : null }).toMatchSnapshot()
        })

        it('reads built-in presets', async () => {
            await using tmpDir = await createTempDir()

            const configFileContents = `
                module.exports = {
                    preset: 'monodeploy/preset-recommended',
                    access: 'public',
                    changelogFilename: 'from_file.changelog.md',
                    changesetFilename: 'from_file.changes.json',
                    conventionalChangelogConfig: '@my/config-from-file',
                    autoCommitMessage: 'chore: release',
                    dryRun: true,
                    forceWriteChangeFiles: true,
                    git: {
                        baseBranch: 'main',
                        commitSha: 'HEAD',
                        remote: 'origin',
                        tag: true,
                    },
                    jobs: 6,
                    registryUrl: 'http://example.com',
                    topological: true,
                    topologicalDev: true,
                    maxConcurrentReads: 3,
                    maxConcurrentWrites: 5,
                    plugins: ['plugin-a', 'plugin-b'],
                    prerelease: true,
                    prereleaseId: 'alpha',
                    prereleaseNPMTag: 'beta',
                }
            `

            const configFilename = path.resolve(path.join(tmpDir.dir, 'monodeploy.config.js'))
            await fs.writeFile(configFilename, configFileContents, 'utf-8')
            setArgs(`--cwd ${tmpDir.dir}`)
            jest.isolateModules(() => {
                require('./index')
            })
            await new Promise((r) => setTimeout(r))
            const config = (monodeploy as jest.MockedFunction<typeof monodeploy>).mock.calls[0][0]
            expect({ ...config, cwd: config.cwd ? '/tmp/cwd' : null }).toMatchSnapshot()
        })
    })
})
