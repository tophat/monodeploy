import childProcess from 'child_process'
import util from 'util'

const exec = util.promisify(childProcess.exec)

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
                dryRun: true,
                autoCommit: true,
                autoCommitMessage: 'chore: release',
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
            testCase: async ({ cwd, run, readFile }) => {
                // First semantic commit
                await exec(`echo "Modification." >> packages/pkg-1/README.md`, {
                    cwd,
                })
                await exec(
                    `git add . && git commit -n -m "feat: some fancy addition" && git push`,
                    { cwd },
                )

                const { stdout, stderr, error } = await run()

                expect(error).toBeUndefined()
                console.log(stdout)
                // Locally
                const localChangeset = JSON.parse(
                    await readFile('changes.json'),
                )
                expect(localChangeset).toMatchSnapshot()
                //  TODO: snapshot changeset

                // On Remote:
                //  TODO: assert git tags
                //  TODO: assert changelog updated

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
