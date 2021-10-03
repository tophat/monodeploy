import { promises as fs } from 'fs'
import path from 'path'

import { getMonodeployConfig, setupMonorepo } from '@monodeploy/test-utils'
import { YarnContext } from '@monodeploy/types'
import { npath } from '@yarnpkg/fslib'
import * as npm from '@yarnpkg/plugin-npm'

import { getLatestPackageTags } from '.'

jest.mock('@yarnpkg/plugin-npm')

const mockNPM = npm as jest.Mocked<
    typeof npm & {
        _reset_: () => void
        _setTag_: (pkgName: string, tagValue: string, tagKey?: string) => void
    }
>

class NetworkError extends Error {
    response?: { statusCode?: number }
    constructor(statusCode: number) {
        super(`Error: ${statusCode}`)
        this.response = { statusCode }
    }
}

describe('getLatestPackageTags', () => {
    let context: YarnContext

    beforeEach(async () => {
        context = await setupMonorepo({
            'pkg-1': {},
            'pkg-2': {},
            'pkg-3': { dependencies: ['pkg-2'] },
            'pkg-4': {},
            'pkg-5': { private: true, dependencies: ['pkg-4'] },
            'pkg-6': {
                dependencies: ['pkg-3', 'pkg-7'],
            },
            'pkg-7': {},
        })
    })

    afterEach(async () => {
        jest.restoreAllMocks()
        mockNPM._reset_()
        try {
            await fs.rm(context.project.cwd, { recursive: true, force: true })
        } catch {}
    })

    it('returns default tag 0.0.0 if no tags found', async () => {
        // Since we haven't set up any tags for any package, everything is 0.0.0
        const config = await getMonodeployConfig({
            cwd: context.project.cwd,
            baseBranch: 'main',
            commitSha: 'shashasha',
        })
        const tags = await getLatestPackageTags({
            config,
            context,
            registryUrl: config.registryUrl ?? 'https://example.org/',
        })
        for (const tagPair of tags) {
            const tag = tagPair[1]
            expect(tag.latest).toEqual('0.0.0')
        }
    })

    it('returns tags from the registry if they exist', async () => {
        const registryTags = new Map(
            Object.entries({
                'pkg-1': { latest: '0.0.1' },
                'pkg-2': { latest: '0.1.0' },
                'pkg-3': { latest: '1.0.0' },
            }),
        )

        for (const [pkgName, map] of registryTags) {
            mockNPM._setTag_(pkgName, map.latest)
        }

        const config = await getMonodeployConfig({
            cwd: context.project.cwd,
            baseBranch: 'main',
            commitSha: 'shashasha',
        })
        const tags = await getLatestPackageTags({
            config,
            context,
            registryUrl: config.registryUrl ?? 'https://example.org/',
        })

        const expectedTags = new Map([
            ...registryTags.entries(),
            ['pkg-4', { latest: '0.0.0' }],
            ['pkg-6', { latest: '0.0.0' }],
            ['pkg-7', { latest: '0.0.0' }],
        ])

        expect(tags).toEqual(expectedTags)
    })

    it('bubbles up error if not 404', async () => {
        const mockError = new NetworkError(500)
        const mockGet = mockNPM.npmHttpUtils.get
        mockNPM.npmHttpUtils.get = jest.fn().mockImplementation(() => {
            throw mockError
        })

        const config = await getMonodeployConfig({
            cwd: context.project.cwd,
            baseBranch: 'main',
            commitSha: 'shashasha',
        })

        await expect(
            async () =>
                await getLatestPackageTags({
                    config,
                    context,
                    registryUrl: config.registryUrl ?? 'https://example.org/',
                }),
        ).rejects.toEqual(mockError)

        mockNPM.npmHttpUtils.get = mockGet
    })

    it('returns default tag if received a 500 and using jfrog', async () => {
        // See: https://www.jfrog.com/jira/browse/RTFACT-16518

        const mockGet = mockNPM.npmHttpUtils.get
        mockNPM.npmHttpUtils.get = jest.fn().mockImplementation(() => {
            throw new NetworkError(500)
        })

        // Since we haven't set up any tags for any package, everything is 0.0.0
        const config = {
            ...(await getMonodeployConfig({
                cwd: context.project.cwd,
                baseBranch: 'main',
                commitSha: 'shashasha',
            })),
            registryUrl: 'https://my.jfrog.io/my/api/npm/my-npm/',
        }
        const tags = await getLatestPackageTags({
            config,
            context,
            registryUrl: config.registryUrl,
        })
        for (const tagPair of tags) {
            const tag = tagPair[1]
            expect(tag.latest).toEqual('0.0.0')
        }

        mockNPM.npmHttpUtils.get = mockGet
    })

    it('returns a null pair for malformed workspaces (missing ident)', async () => {
        // Stripping pkg-2 of its ident
        const pkg2Cwd = path.resolve(context.project.cwd, path.join('packages', 'pkg-2'))
        context.project.workspacesByCwd.get(npath.toPortablePath(pkg2Cwd))!.manifest.name = null

        const config = await getMonodeployConfig({
            cwd: context.project.cwd,
            baseBranch: 'main',
            commitSha: 'shashasha',
        })
        const tags = await getLatestPackageTags({
            config,
            context,
            registryUrl: config.registryUrl ?? 'https://example.org/',
        })

        expect(tags.keys()).not.toContain('pkg-2')
    })
})
