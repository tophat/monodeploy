import { join, resolve } from 'path'

import * as npm from '@yarnpkg/plugin-npm'

import { setupContext } from '../../../testUtils'

import { getLatestPackageTags } from '.'

const cwd = resolve(join(process.cwd(), './example-monorepo'))

const defaultMonodeployConfig = {
    cwd,
}

jest.mock('@yarnpkg/plugin-npm')

const mockNPM = npm as jest.Mocked<
    typeof npm & {
        _reset_: () => void
        _setTag_: (pkgName: string, tagValue: string, tagKey?: string) => void
    }
>

describe('getLatestPackageTags', () => {
    afterEach(() => {
        jest.restoreAllMocks()
        mockNPM._reset_()
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

        for (const tagPair of registryTags) mockNPM._setTag_(...tagPair)

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
        const mockGet = mockNPM.npmHttpUtils.get
        mockNPM.npmHttpUtils.get = jest.fn().mockImplementation(() => {
            throw mockError
        })

        await expect(async () =>
            getLatestPackageTags(defaultMonodeployConfig, context),
        ).rejects.toEqual(mockError)

        mockNPM.npmHttpUtils.get = mockGet
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
