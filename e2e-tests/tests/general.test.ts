import { RegistryMode } from '@monodeploy/types'

import setupProject from 'helpers/setupProject'

describe('General Usage', () => {
    it.each(['pnp', 'node-modules'] as const)(
        'runs the full monodeploy pipeline for %s linker',
        async (nodeLinker) =>
            setupProject({
                repository: [
                    {
                        'pkg-1': {},
                        'pkg-2': {
                            dependencies: ['pkg-1'],
                        },
                        'pkg-3': { dependencies: [['pkg-2', 'workspace:*']] },
                        'pkg-4': { dependencies: ['pkg-3'] },
                        'pkg-isolated': {},
                    },
                    {
                        nodeLinker,
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
                    registryMode: RegistryMode.NPM,
                    topological: true,
                    topologicalDev: true,
                    maxConcurrentReads: 1,
                    maxConcurrentWrites: 1,
                },
                testCase: async ({ run, readFile, exec, writeFile }) => {
                    // First semantic commit
                    await writeFile('packages/pkg-1/README.md', 'Modification.')
                    await exec(
                        'git add . && git commit -n -m "feat: some fancy addition" && git push',
                    )

                    const { error } = await run()

                    if (error) console.error(error)
                    expect(error).toBeUndefined()

                    // verify yarn.lock is not staged with modifications
                    await exec('yarn && git diff --quiet --exit-code yarn.lock')

                    // Locally
                    let localChangeset = JSON.parse(await readFile('changes.json.tmp'))
                    expect(localChangeset).toEqual({
                        'pkg-1': expect.objectContaining({
                            changelog: expect.stringContaining('some fancy addition'),
                            tag: 'pkg-1@0.1.0',
                            version: '0.1.0',
                            strategy: 'minor',
                        }),
                        'pkg-2': expect.objectContaining({
                            changelog: null,
                            tag: 'pkg-2@0.0.1',
                            version: '0.0.1',
                            strategy: 'patch',
                        }),
                        'pkg-3': expect.objectContaining({
                            changelog: null,
                            tag: 'pkg-3@0.0.1',
                            version: '0.0.1',
                            strategy: 'patch',
                        }),
                        'pkg-4': expect.objectContaining({
                            changelog: null,
                            tag: 'pkg-4@0.0.1',
                            version: '0.0.1',
                            strategy: 'patch',
                        }),
                    })

                    let localChangelog = await readFile('changelog.md')
                    expect(localChangelog).toEqual(expect.stringContaining('some fancy addition'))

                    // On Remote:
                    // Assert tags pushed
                    await exec('git ls-remote --exit-code --tags origin refs/tags/pkg-1@0.1.0')
                    await exec('git ls-remote --exit-code --tags origin refs/tags/pkg-2@0.0.1')
                    await exec('git ls-remote --exit-code --tags origin refs/tags/pkg-3@0.0.1')

                    // Assert changelog updated on remote
                    expect(
                        (await exec('git cat-file blob origin/main:changelog.md')).stdout,
                    ).toEqual(expect.stringContaining('fancy'))

                    // -----

                    // Make another semantic change
                    await writeFile('packages/pkg-2/README.md', 'Modification.')
                    await exec(
                        'git add . && git commit -n -m "feat: some breaking feat addition" ' +
                            '-m "BREAKING CHANGE: This is a breaking change" && git push',
                    )

                    const { error: error2 } = await run()

                    if (error2) console.error(error2)
                    expect(error2).toBeUndefined()

                    // ---

                    // verify yarn.lock is not staged with modifications
                    await exec('yarn && git diff --quiet --exit-code yarn.lock')

                    localChangeset = JSON.parse(await readFile('changes.json.tmp'))
                    expect(localChangeset).toEqual({
                        'pkg-2': expect.objectContaining({
                            changelog: expect.stringContaining('breaking'),
                            tag: 'pkg-2@1.0.0',
                            version: '1.0.0',
                            strategy: 'major',
                        }),
                        'pkg-3': expect.objectContaining({
                            changelog: null,
                            tag: 'pkg-3@0.0.2',
                            version: '0.0.2',
                            strategy: 'patch',
                        }),
                        'pkg-4': expect.objectContaining({
                            changelog: null,
                            tag: 'pkg-4@0.0.2',
                            version: '0.0.2',
                            strategy: 'patch',
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
                    await exec('git ls-remote --exit-code --tags origin refs/tags/pkg-2@1.0.0')
                    await exec('git ls-remote --exit-code --tags origin refs/tags/pkg-3@0.0.2')

                    // Assert changelog updated on remote
                    expect(
                        (await exec('git cat-file blob origin/main:changelog.md')).stdout,
                    ).toEqual(expect.stringContaining('breaking'))

                    // assert modified manifests are correct
                    const pkg3Manifest = JSON.parse(
                        (
                            await exec('git cat-file blob origin/main:packages/pkg-3/package.json')
                        ).stdout.toString(),
                    )
                    expect(pkg3Manifest.dependencies).toEqual(
                        expect.objectContaining({
                            'pkg-2': 'workspace:^1.0.0',
                        }),
                    )
                },
            })(),
    )
})
