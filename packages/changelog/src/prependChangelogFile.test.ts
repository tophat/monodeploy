import { promises as fs } from 'fs'
import path from 'path'

import {
    cleanUp,
    createFile,
    getMonodeployConfig,
    setupContext,
    setupTestRepository,
} from '@monodeploy/test-utils'
import { ChangesetSchema, YarnContext } from '@monodeploy/types'
import { Workspace, structUtils } from '@yarnpkg/core'
import { PortablePath } from '@yarnpkg/fslib'

import { prependChangelogFile } from '.'

const getWorkspace = (context: YarnContext, name: string): Workspace =>
    context.project.getWorkspaceByIdent(structUtils.parseIdent(name))

describe('prependChangelogFile', () => {
    let workspacePath: PortablePath

    beforeEach(async () => {
        workspacePath = await setupTestRepository()
    })

    afterEach(async () => {
        jest.restoreAllMocks()
        await cleanUp([workspacePath])
    })

    it('returns early if no changelogFilename is defined', async () => {
        const cwd = workspacePath
        const writeMock = jest.spyOn(fs, 'writeFile')
        const readMock = jest.spyOn(fs, 'readFile')

        const config = await getMonodeployConfig({
            baseBranch: 'main',
            commitSha: 'sha-1',
            cwd,
            changelogFilename: undefined,
        })
        const context = await setupContext(cwd)
        const changeset: ChangesetSchema = {
            'pkg-1': { version: '1.0.0', changelog: 'wowchanges', tag: null, group: 'pkg-1' },
        }

        // TODO: Better assertion.
        await expect(async () =>
            prependChangelogFile({
                config,
                context,
                changeset,
                workspaces: new Set(),
            }),
        ).not.toThrow()
        expect(writeMock).not.toHaveBeenCalled()
        expect(readMock).not.toHaveBeenCalled()
    })

    it('throws if the changelog is not readable', async () => {
        const cwd = workspacePath

        const mockChangelogFilename = 'changelog'
        const config = await getMonodeployConfig({
            baseBranch: 'main',
            commitSha: 'sha-1',
            cwd,
            changelogFilename: mockChangelogFilename,
        })
        const context = await setupContext(cwd)
        const changeset: ChangesetSchema = {
            'pkg-1': { version: '1.0.0', changelog: 'wowchanges', tag: null, group: 'pkg-1' },
        }

        // We'll grab a handle so prepend won't be able to write
        const handle = await fs.open(path.join(cwd, mockChangelogFilename), 'w+')

        await expect(async () =>
            prependChangelogFile({
                config,
                context,
                changeset,
                workspaces: new Set(),
            }),
        ).rejects.toThrow()

        await handle.close()
    })

    it("throws if the changelog doesn't contain the expected marker", async () => {
        const cwd = workspacePath

        const config = await getMonodeployConfig({
            baseBranch: 'main',
            commitSha: 'sha-1',
            cwd,
            changelogFilename: 'changelog',
        })
        const context = await setupContext(cwd)
        const changeset: ChangesetSchema = {
            'pkg-1': { version: '1.0.0', changelog: 'wowchanges', tag: null, group: 'pkg-1' },
        }
        await createFile({ filePath: 'changelog', cwd, content: 'wonomarker' })
        await expect(async () =>
            prependChangelogFile({
                config,
                context,
                changeset,
                workspaces: new Set(),
            }),
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
            baseBranch: 'main',
            commitSha: 'sha-1',
            cwd,
            changelogFilename: 'changelog',
            dryRun: true,
        })
        const context = await setupContext(cwd)
        const changeset: ChangesetSchema = {
            'pkg-1': { version: '1.0.0', changelog: 'wowchanges', tag: null, group: 'pkg-1' },
        }

        // TODO: Better assertion.
        await expect(async () =>
            prependChangelogFile({
                config,
                context,
                changeset,
                workspaces: new Set(),
            }),
        ).not.toThrow()
        expect(writeMock).not.toHaveBeenCalled()
    })

    it('writes to the changelog file', async () => {
        const cwd = workspacePath
        const mockChangelogFilename = 'changelog'
        const config = await getMonodeployConfig({
            baseBranch: 'main',
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
        const changeset: ChangesetSchema = {
            'pkg-1': {
                version: '1.0.0',
                changelog: 'wowchanges\nthisisachangelog',
                tag: null,
                group: 'pkg-1',
            },
            'pkg-2': {
                version: '1.1.0',
                changelog: 'just a version bump',
                tag: null,
                group: 'pkg-2',
            },
        }

        await prependChangelogFile({
            config,
            context,
            changeset,
            workspaces: new Set(),
        })

        const changelogContents = await fs.readFile(path.join(cwd, mockChangelogFilename), {
            encoding: 'utf8',
        })

        expect(changelogContents).toEqual(expect.stringContaining(changeset['pkg-1'].changelog!))
    })

    it('creates the changelog file if it does not exist', async () => {
        const cwd = workspacePath
        const mockChangelogFilename = 'changelog'
        const config = await getMonodeployConfig({
            baseBranch: 'main',
            commitSha: 'sha-1',
            cwd,
            changelogFilename: mockChangelogFilename,
        })
        const context = await setupContext(cwd)
        const changeset: ChangesetSchema = {
            'pkg-1': {
                version: '1.0.0',
                changelog: 'wowchanges\nthisisachangelog',
                tag: null,
                group: 'pkg-1',
            },
            'pkg-2': {
                version: '1.1.0',
                changelog: 'just a version bump',
                tag: null,
                group: 'pkg-2',
            },
        }

        await prependChangelogFile({
            config,
            context,
            changeset,
            workspaces: new Set(),
        })

        const changelogContents = await fs.readFile(path.join(cwd, mockChangelogFilename), {
            encoding: 'utf8',
        })

        expect(changelogContents).toEqual(expect.stringContaining(changeset['pkg-1'].changelog!))
    })

    it('writes changelogs for each package if token present', async () => {
        const cwd = workspacePath
        const config = await getMonodeployConfig({
            baseBranch: 'main',
            commitSha: 'sha-1',
            cwd,
            changelogFilename: '<packageDir>/CHANGELOG.md',
        })
        const context = await setupContext(cwd)
        const changeset: ChangesetSchema = {
            'pkg-1': {
                version: '1.0.0',
                changelog: 'wowchanges\nthisisachangelog',
                tag: null,
                group: 'pkg-1',
            },
            'pkg-2': {
                version: '1.1.0',
                changelog: 'just a version bump',
                tag: null,
                group: 'pkg-2',
            },
        }
        const workspaces = new Set([getWorkspace(context, 'pkg-1'), getWorkspace(context, 'pkg-2')])

        await prependChangelogFile({ config, context, changeset, workspaces })

        const onDiskChangelogPkg1 = await fs.readFile(
            path.join(cwd, 'packages', 'pkg-1', 'CHANGELOG.md'),
            { encoding: 'utf8' },
        )

        expect(onDiskChangelogPkg1).toEqual(expect.stringContaining(changeset['pkg-1'].changelog!))
        expect(onDiskChangelogPkg1).not.toEqual(
            expect.stringContaining(changeset['pkg-2'].changelog!),
        )

        const onDiskChangelogPkg2 = await fs.readFile(
            path.join(cwd, 'packages', 'pkg-2', 'CHANGELOG.md'),
            { encoding: 'utf8' },
        )

        expect(onDiskChangelogPkg2).toEqual(expect.stringContaining(changeset['pkg-2'].changelog!))
        expect(onDiskChangelogPkg2).not.toEqual(
            expect.stringContaining(changeset['pkg-1'].changelog!),
        )
    })

    it('does not write to the changelog file if there are no changes', async () => {
        const cwd = workspacePath
        const mockChangelogFilename = 'changelog'
        const config = await getMonodeployConfig({
            baseBranch: 'main',
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
        const changeset: ChangesetSchema = {}

        const contentsBefore = await fs.readFile(path.join(cwd, mockChangelogFilename), {
            encoding: 'utf8',
        })

        await prependChangelogFile({
            config,
            context,
            changeset,
            workspaces: new Set(),
        })

        const contentsAfter = await fs.readFile(path.join(cwd, mockChangelogFilename), {
            encoding: 'utf8',
        })

        expect(contentsBefore).toEqual(contentsAfter)
    })
})
