import { promises as fs, readFileSync } from 'fs'

import {
    cleanUp,
    createFile,
    getMonodeployConfig,
    setupContext,
    setupTestRepository,
} from '@monodeploy/test-utils'

import { prependChangelogFile } from '.'

describe('prependChangelogFile', () => {
    let workspacePath

    beforeEach(async () => {
        workspacePath = await setupTestRepository()
    })

    afterEach(async () => {
        await cleanUp([workspacePath])
        jest.restoreAllMocks()
    })

    it('returns early if no changelogFilename is defined', async () => {
        const cwd = workspacePath
        const writeMock = jest.spyOn(fs, 'writeFile')
        const readMock = jest.spyOn(fs, 'readFile')

        const config = await getMonodeployConfig({
            baseBranch: 'master',
            commitSha: 'sha-1',
            cwd,
            changelogFilename: null,
        })
        const context = await setupContext(cwd)
        const changeset = {
            '1.0.0': { version: '1.0.0', changelog: 'wowchanges' },
        }

        // TODO: Better assertion.
        await expect(async () =>
            prependChangelogFile(config, context, changeset),
        ).not.toThrow()
        expect(writeMock).not.toHaveBeenCalled()
        expect(readMock).not.toHaveBeenCalled()
    })

    it('throws if the changelog is not readable', async () => {
        const cwd = workspacePath

        // The changelog doesn't exist at the given path.
        const config = await getMonodeployConfig({
            baseBranch: 'master',
            commitSha: 'sha-1',
            cwd,
            changelogFilename: 'changelog',
        })
        const context = await setupContext(cwd)
        const changeset = {
            '1.0.0': { version: '1.0.0', changelog: 'wowchanges' },
        }

        await expect(async () =>
            prependChangelogFile(config, context, changeset),
        ).rejects.toThrow()
    })

    it("throws if the changelog doesn't contain the expected marker", async () => {
        const cwd = workspacePath

        const config = await getMonodeployConfig({
            baseBranch: 'master',
            commitSha: 'sha-1',
            cwd,
            changelogFilename: 'changelog',
        })
        const context = await setupContext(cwd)
        const changeset = {
            '1.0.0': { version: '1.0.0', changelog: 'wowchanges' },
        }
        await createFile({ filePath: 'changelog', cwd, content: 'wonomarker' })
        await expect(async () =>
            prependChangelogFile(config, context, changeset),
        ).rejects.toThrow()
    })

    it('skips writing if in dry-run mode', async () => {
        const cwd = workspacePath
        await createFile({
            filePath: 'changelog',
            cwd,
            content: '<!-- MONODEPLOY:BELOW -->',
        })
        const writeMock = jest.spyOn(fs, 'writeFile')
        const config = await getMonodeployConfig({
            baseBranch: 'master',
            commitSha: 'sha-1',
            cwd,
            changelogFilename: 'changelog',
            dryRun: true,
        })
        const context = await setupContext(cwd)
        const changeset = {
            '1.0.0': { version: '1.0.0', changelog: 'wowchanges' },
        }

        // TODO: Better assertion.
        await expect(async () =>
            prependChangelogFile(config, context, changeset),
        ).not.toThrow()
        expect(writeMock).not.toHaveBeenCalled()
    })

    it('writes to the changelog file', async () => {
        const cwd = workspacePath
        const mockChangelogFilename = 'changelog'
        const config = await getMonodeployConfig({
            baseBranch: 'master',
            commitSha: 'sha-1',
            cwd,
            changelogFilename: mockChangelogFilename,
        })
        const context = await setupContext(cwd)
        await createFile({
            filePath: 'changelog',
            cwd: workspacePath,
            content: '<!-- MONODEPLOY:BELOW -->',
        })
        const changeset = {
            'pkg-1': {
                version: '1.0.0',
                changelog: 'wowchanges\nthisisachangelog',
            },
        }

        await prependChangelogFile(config, context, changeset)

        const changelogContents = readFileSync(
            `${cwd}/${mockChangelogFilename}`,
            { encoding: 'utf8' },
        )

        expect(changelogContents).toEqual(
            expect.stringContaining(changeset['pkg-1'].changelog),
        )
    })
})
