import { RegistryMode } from '@monodeploy/types'

import setupProject from 'helpers/setupProject'

describe('Issue #601', () => {
    it(
        'handles merge conflicts',
        setupProject({
            repository: [
                {
                    'pkg-1': {},
                },
            ],
            config: {
                access: 'public',
                changelogFilename: '<packageDir>/CHANGELOG.md',
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
                persistVersions: false,
                registryMode: RegistryMode.NPM,
                topological: true,
                topologicalDev: true,
                maxConcurrentReads: 1,
                maxConcurrentWrites: 1,
            },
            testCase: async ({ run, readFile, exec, writeFile }) => {
                // First semantic commit
                await writeFile('packages/pkg-1/README.md', 'Modification.')
                await exec('git add . && git commit -n -m "feat: change 1" && git push')

                const { error } = await run()
                if (error) console.error(error)
                expect(error).toBeUndefined()

                // We should have a 'pkg-1/CHANGELOG.md' at this point.
                expect(await readFile('packages/pkg-1/CHANGELOG.md')).toMatch(/change 1/)

                await exec('git checkout -b change_2')
                await writeFile('packages/pkg-1/README.md', 'Modification 2.')
                await exec('git add . && git commit -n -m "feat: change 2"')

                await exec('git checkout -b change_3') // change_3 is based on change_2
                await writeFile('packages/pkg-1/README.md', 'Modification 3.')
                await exec('git add . && git commit -n -m "feat: change 3"')

                // Back on change 2, we'll publish
                await exec('git checkout main')
                await exec('git merge change_2 --no-verify --no-edit')

                const { error: error2 } = await run()
                if (error2) console.error(error2)
                expect(error2).toBeUndefined()

                // At this point we expected change 2 followed by change 1 in the changelog
                let remoteChangelog = (
                    await exec('git cat-file blob origin/main:packages/pkg-1/CHANGELOG.md')
                ).stdout
                expect(remoteChangelog).toMatch(/change 2.*change 1/s)

                // Switch back to change_3 which is now "out of sync" with main
                await exec('git checkout main')
                await exec('git reset --hard change_3')

                // If we attempt to publish, we'll have a conflict with the CHANGELOG.md file
                // since our change_3 will only have change 1 and change 3 and will be missing change 2.
                // We'll validate this:
                remoteChangelog = (
                    await exec('git cat-file blob origin/main:packages/pkg-1/CHANGELOG.md')
                ).stdout
                expect(remoteChangelog).toEqual(expect.stringContaining('change 1'))
                expect(remoteChangelog).toEqual(expect.stringContaining('change 2'))
                expect(remoteChangelog).not.toEqual(expect.stringContaining('change 3'))

                // Now we publish. It's up to monodeploy to deal with or prevent conflicts.
                const { error: error3 } = await run()
                if (error3) console.error(error3)
                expect(error3).toBeUndefined()

                // If we get this far, monodeploy didn't fail due to the conflicts. We'll verify the changelog
                // with ordering:
                remoteChangelog = (
                    await exec('git cat-file blob origin/main:packages/pkg-1/CHANGELOG.md')
                ).stdout
                expect(remoteChangelog).toMatch(/change 3.*change 2.*change 1/s)
                expect((await (await exec('git describe --abbrev=0')).stdout).trim()).toBe(
                    'pkg-1@0.3.0',
                )

                // NOTE: the hard reset we do disassociates the git tag with the HEAD of main.
                // This causes the change_3 monodeploy run to include changes 2 and 3. This is
                // just a quirk of the test scenario.
            },
        }),
    )
})
