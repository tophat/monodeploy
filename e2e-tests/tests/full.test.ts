import setupProject from 'helpers/setupProject'

const TIMEOUT = 180000 // we need time for docker interactions

describe('Full E2E', () => {
    it(
        'runs the full monodeploy pipeline',
        setupProject({
            repository: [
                {
                    'pkg-1': {},
                    'pkg-2': {
                        dependencies: ['pkg-1'],
                    },
                    'pkg-3': { dependencies: ['pkg-2'] },
                    'pkg-4': { dependencies: ['pkg-3'] },
                    'pkg-isolated': {},
                },
            ],
            config: {
                access: 'public',
                changelogFilename: 'changelog.md',
                changesetFilename: 'changes.json.tmp',
                dryRun: false,
                autoCommit: true,
                autoCommitMessage: 'chore: release',
                conventionalChangelogConfig: require.resolve(
                    '@tophat/conventional-changelog-config',
                ),
                git: {
                    push: true,
                    remote: 'origin',
                    tag: true,
                },
                jobs: 1,
                persistVersions: true,
                noRegistry: false,
                topological: true,
                topologicalDev: true,
                maxConcurrentReads: 1,
                maxConcurrentWrites: 1,
            },
            testCase: async ({ run, readFile, exec }) => {
                // First semantic commit
                await exec(`echo "Modification." >> packages/pkg-1/README.md`)
                await exec(
                    `git add . && git commit -n -m "feat: some fancy addition" && git push`,
                )

                const { error } = await run()

                if (error) console.error(error)
                expect(error).toBeUndefined()

                // Locally
                let localChangeset = JSON.parse(
                    await readFile('changes.json.tmp'),
                )
                expect(localChangeset).toEqual({
                    'pkg-1': expect.objectContaining({
                        changelog: expect.stringContaining(
                            'some fancy addition',
                        ),
                        tag: 'pkg-1@0.1.0',
                        version: '0.1.0',
                    }),
                    'pkg-2': expect.objectContaining({
                        changelog: null,
                        tag: 'pkg-2@0.0.1',
                        version: '0.0.1',
                    }),
                    'pkg-3': expect.objectContaining({
                        changelog: null,
                        tag: 'pkg-3@0.0.1',
                        version: '0.0.1',
                    }),
                })

                let localChangelog = await readFile('changelog.md')
                expect(localChangelog).toEqual(
                    expect.stringContaining('some fancy addition'),
                )

                // On Remote:
                // Assert tags pushed
                await exec(
                    `git ls-remote --exit-code --tags origin refs/tags/pkg-1@0.1.0`,
                )
                await exec(
                    `git ls-remote --exit-code --tags origin refs/tags/pkg-2@0.0.1`,
                )
                await exec(
                    `git ls-remote --exit-code --tags origin refs/tags/pkg-3@0.0.1`,
                )

                // Assert changelog updated on remote
                expect(
                    (await exec(`git cat-file blob origin/master:changelog.md`))
                        .stdout,
                ).toEqual(expect.stringContaining('fancy'))

                // -----

                // Make another semantic change
                await exec(`echo "Modification." >> packages/pkg-2/README.md`)
                await exec(
                    `git add . && git commit -n -m "feat: some breaking feat addition" ` +
                        `-m "BREAKING CHANGE: This is a breaking change" && git push`,
                )

                const { error: error2 } = await run()

                if (error2) console.error(error2)
                expect(error2).toBeUndefined()

                // ---

                localChangeset = JSON.parse(await readFile('changes.json.tmp'))
                expect(localChangeset).toEqual({
                    'pkg-2': expect.objectContaining({
                        changelog: expect.stringContaining('breaking'),
                        tag: 'pkg-2@1.0.0',
                        version: '1.0.0',
                    }),
                    'pkg-3': expect.objectContaining({
                        changelog: null,
                        tag: 'pkg-3@0.0.2',
                        version: '0.0.2',
                    }),
                    'pkg-4': expect.objectContaining({
                        changelog: null,
                        tag: 'pkg-4@0.0.1',
                        version: '0.0.1',
                    }),
                })

                localChangelog = await readFile('changelog.md')
                expect(localChangelog).toEqual(
                    expect.stringContaining('fancy'), // should have old entry
                )
                expect(localChangelog).toEqual(
                    expect.stringContaining('breaking'), // should have new entry
                )

                // On Remote:
                // Assert tags pushed
                await exec(
                    `git ls-remote --exit-code --tags origin refs/tags/pkg-2@1.0.0`,
                )
                await exec(
                    `git ls-remote --exit-code --tags origin refs/tags/pkg-3@0.0.2`,
                )

                // Assert changelog updated on remote
                expect(
                    (await exec(`git cat-file blob origin/master:changelog.md`))
                        .stdout,
                ).toEqual(expect.stringContaining('breaking'))
            },
        }),
        TIMEOUT,
    )

    it.todo(
        'runs the full monodeploy pipeline for pre-release',
        setupProject({
            repository: [
                {
                    'pkg-1': {},
                    'pkg-2': {
                        dependencies: ['pkg-1'],
                    },
                    'pkg-3': { dependencies: ['pkg-2'] },
                    'pkg-4': { dependencies: ['pkg-3'] },
                    'pkg-isolated': {},
                },
            ],
            config: {
                access: 'public',
                changelogFilename: 'changelog.md',
                changesetFilename: 'changes.json.tmp',
                dryRun: false,
                autoCommit: true,
                autoCommitMessage: 'chore: release',
                conventionalChangelogConfig: require.resolve(
                    '@tophat/conventional-changelog-config',
                ),
                git: {
                    push: true,
                    remote: 'origin',
                    tag: true,
                },
                jobs: 1,
                persistVersions: true,
                noRegistry: false,
                topological: true,
                topologicalDev: true,
                maxConcurrentReads: 1,
                maxConcurrentWrites: 1,
                prerelease: false,
                prereleaseId: 'alpha',
                prereleaseNPMTag: 'next',
            },
            testCase: async ({ run, readFile, exec }) => {
                // First semantic commit
                await exec(`echo "Modification." >> packages/pkg-1/README.md`)
                await exec(
                    `git add . && git commit -n -m "feat: some fancy addition" && git push`,
                )

                const { error } = await run()

                if (error) console.error(error)
                expect(error).toBeUndefined()

                // On Remote:
                // Assert tags pushed
                await exec(
                    `git ls-remote --exit-code --tags origin refs/tags/pkg-1@0.1.0`,
                )
                await exec(
                    `git ls-remote --exit-code --tags origin refs/tags/pkg-2@0.0.1`,
                )
                await exec(
                    `git ls-remote --exit-code --tags origin refs/tags/pkg-3@0.0.1`,
                )

                // Assert changelog updated on remote
                expect(
                    (await exec(`git cat-file blob origin/master:changelog.md`))
                        .stdout,
                ).toEqual(expect.stringContaining('fancy'))

                // -----

                // Make another semantic change
                await exec(`echo "Modification." >> packages/pkg-1/README.md`)
                await exec(
                    `git add . && git commit -n -m "feat: some exciting addition"`,
                )

                const { error: error2 } = await run(['--prerelease'])

                if (error2) console.error(error2)
                expect(error2).toBeUndefined()

                // ---

                const localChangeset = JSON.parse(
                    await readFile('changes.json.tmp'),
                )
                expect(localChangeset).toEqual({
                    'pkg-1': expect.objectContaining({
                        changelog: expect.stringContaining(
                            'some exciting addition',
                        ),
                        tag: 'pkg-1@0.2.0-alpha.0',
                        version: '0.2.0-alpha.0',
                    }),
                    'pkg-2': expect.objectContaining({
                        changelog: null,
                        tag: 'pkg-2@0.0.2-alpha.0',
                        version: '0.0.2-alpha.0',
                    }),
                    'pkg-3': expect.objectContaining({
                        changelog: null,
                        tag: 'pkg-3@0.0.2-alpha.0',
                        version: '0.0.2-alpha.0',
                    }),
                    'pkg-4': expect.objectContaining({
                        changelog: null,
                        tag: 'pkg-4@0.0.2-alpha.0',
                        version: '0.0.2-alpha.0',
                    }),
                })

                const localChangelog = await readFile('changelog.md')
                expect(localChangelog).toEqual(
                    expect.stringContaining('fancy'), // should have old entry
                )
                expect(localChangelog).toEqual(
                    expect.stringContaining('exciting'), // should have new entry
                )

                // On Remote:
                // Assert tags pushed
                await exec(
                    `git ls-remote --exit-code --tags origin refs/tags/pkg-1@0.2.0-alpha.0`,
                )

                // Assert changelog updated on remote
                expect(
                    (await exec(`git cat-file blob origin/master:changelog.md`))
                        .stdout,
                ).toEqual(expect.stringContaining('exciting'))

                // Another pre-release
                // Make another semantic change
                await exec(`echo "Modification." >> packages/pkg-1/README.md`)
                await exec(`git add . && git commit -n -m "fix: bugfix"`)
                const { error: error3 } = await run(['--prerelease'])

                if (error3) console.error(error2)
                expect(error3).toBeUndefined()

                // On Remote:
                // Assert tags pushed
                await exec(
                    `git ls-remote --exit-code --tags origin refs/tags/pkg-1@0.2.0-alpha.1`,
                )
            },
        }),
        TIMEOUT,
    )
})
