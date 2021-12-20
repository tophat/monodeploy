import path from 'path'

import {
    cleanUp,
    getMonodeployConfig,
    setupContext,
    setupTestRepository,
} from '@monodeploy/test-utils'
import { PortablePath } from '@yarnpkg/fslib'

import { writeChangesetFile } from '.'

describe('writeChangesetFile', () => {
    let workspacePath: PortablePath

    beforeEach(async () => {
        workspacePath = await setupTestRepository()
    })

    afterEach(async () => {
        jest.restoreAllMocks()
        await cleanUp([workspacePath])
    })

    it('creates changeset', async () => {
        const cwd = workspacePath
        const config = {
            ...(await getMonodeployConfig({
                baseBranch: 'main',
                commitSha: 'sha-1',
                cwd,
            })),
            changesetFilename: undefined,
            conventionalChangelogConfig: path.resolve(
                path.join(__dirname, '..', 'mocks', 'conventional-config-fn.mock.ts'),
            ),
        }
        const context = await setupContext(cwd)

        const changeset = await writeChangesetFile({
            config,
            context,
            previousTags: new Map([
                ['pkg-1', '1.0.0'],
                ['pkg-2', '4.5.2'],
            ]),
            nextTags: new Map([
                ['pkg-1', '2.0.0'],
                ['pkg-2', '4.6.0'],
            ]),
            versionStrategies: new Map([
                [
                    'pkg-1',
                    {
                        type: 'major',
                        commits: [
                            {
                                sha: 'abc',
                                body: 'feat: some feature\n\nBREAKING CHANGE: Major bump.',
                            },
                        ],
                    },
                ],
                [
                    'pkg-2',
                    {
                        type: 'minor',
                        commits: [{ sha: 'bca', body: 'feat: some fancy change' }],
                    },
                ],
            ]),
            gitTags: new Map([
                ['pkg-1', 'pkg-1@2.0.0'],
                ['pkg-2', 'pkg-1@4.6.0'],
            ]),
        })

        expect(changeset).toEqual(
            expect.objectContaining({
                'pkg-1': {
                    changelog: expect.stringContaining('some feature'),
                    previousVersion: '1.0.0',
                    strategy: 'major',
                    tag: 'pkg-1@2.0.0',
                    version: '2.0.0',
                    group: 'pkg-1',
                },
                'pkg-2': {
                    changelog: expect.stringContaining('fancy change'),
                    previousVersion: '4.5.2',
                    strategy: 'minor',
                    tag: 'pkg-1@4.6.0',
                    version: '4.6.0',
                    group: 'pkg-2',
                },
            }),
        )
    })
})
