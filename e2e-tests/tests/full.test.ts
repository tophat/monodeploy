import setupProject from 'helpers/setupProject'

const TIMEOUT = 120000 // we need time for docker interactions

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
                changesetFilename: 'changes.json',
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
                const localChangeset = JSON.parse(
                    await readFile('changes.json'),
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
                        changelog: expect.not.stringContaining('fancy'),
                        tag: 'pkg-2@0.0.1',
                        version: '0.0.1',
                    }),
                    'pkg-3': expect.objectContaining({
                        changelog: expect.not.stringContaining('fancy'),
                        tag: 'pkg-3@0.0.1',
                        version: '0.0.1',
                    }),
                })

                const localChangelog = await readFile('changelog.md')
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
                // TODO: run again

                // Locally
                //  TODO: snapshot changeset

                // On Remote:
                //  TODO: assert git tags
                //  TODO: assert changelog updated
            },
        }),
        TIMEOUT,
    )
})
