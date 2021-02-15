import { join, resolve } from 'path'

import { getPluginConfiguration } from '@yarnpkg/cli'
import { Configuration, Project } from '@yarnpkg/core'
import * as npm from '@yarnpkg/plugin-npm'

import { YarnContext } from 'monodeploy-types'

import { getLatestPackageTags } from '.'

const cwd = resolve(join(process.cwd(), './example-monorepo'))

async function setupContext(cwd: string): Promise<YarnContext> {
    const configuration = await Configuration.find(
        cwd,
        getPluginConfiguration(),
    )
    const { project, workspace } = await Project.find(configuration, cwd)

    const context: YarnContext = {
        configuration,
        project,
        workspace,
    }

    return context
}

const defaultMonodeployConfig = {
    cwd,
}

// TODO: add mock type.
jest.mock('@yarnpkg/plugin-npm')
describe('getLatestPackageTags', () => {
    afterEach(() => {
        jest.restoreAllMocks()
        npm._reset_()
    })

    it('returns default tag 0.0.0 if no tags found', async () => {
        const context = await setupContext(cwd)

        // Since we haven't set up any tags for any package, everything is 0.0.0
        const tags = await getLatestPackageTags(
            defaultMonodeployConfig,
            context,
        )
        for (const tagPair of tags) {
            const tag = tagPair[1]
            expect(tag).toEqual('0.0.0')
        }
    })

    it('returns tags from the registry if they exist', async () => {
        const context = await setupContext(cwd)

        const registryTags = new Map(
            Object.entries({
                'pkg-1': '0.0.1',
                'pkg-2': '0.1.0',
                'pkg-3': '1.0.0',
            }),
        )

        for (const tagPair of registryTags) npm._setTag_(...tagPair)

        const tags = await getLatestPackageTags(
            defaultMonodeployConfig,
            context,
        )

        const expectedTags = new Map([
            ...registryTags.entries(),
            ['pkg-4', '0.0.0'],
            ['pkg-6', '0.0.0'],
            ['pkg-7', '0.0.0'],
        ])

        expect(tags).toEqual(expectedTags)
    })

    it('bubbles up error if not 404', async () => {
        const context = await setupContext(cwd)
        const mockError = new Error('Oh blarg. Something bad happened.')
        const mockGet = npm.npmHttpUtils.get
        npm.npmHttpUtils.get = jest.fn().mockImplementation(() => {
            throw mockError
        })

        await expect(async () =>
            getLatestPackageTags(defaultMonodeployConfig, context),
        ).rejects.toEqual(mockError)

        npm.npmHttpUtils.get = mockGet
    })

    it('returns a null pair for malformed workspaces (missing ident)', async () => {
        const context = await setupContext(cwd)

        // Stripping pkg-2 of its ident
        const pkg2Cwd = resolve(join(cwd, 'packages/pkg-2'))
        context.project.workspacesByCwd.get(pkg2Cwd).manifest.name = null

        const tags = await getLatestPackageTags(
            defaultMonodeployConfig,
            context,
        )

        expect(tags.keys()).not.toContain('pkg-2')
    })
})
