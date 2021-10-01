import { cleanUp, initGitRepository, setupMonorepo } from '@monodeploy/test-utils'
import { YarnContext } from '@monodeploy/types'
import { execUtils } from '@yarnpkg/core'

import { gitLastTaggedCommit, gitPushTags, gitTag } from '.'

jest.mock('@monodeploy/logging')

const setupRepo = async () => {
    const context = await setupMonorepo({
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
    await initGitRepository(context.project.cwd)
    return context
}

describe('@monodeploy/git (mocked invariants)', () => {
    let context: YarnContext

    beforeEach(async () => {
        context = await setupRepo()
    })

    afterEach(async () => {
        jest.restoreAllMocks()
        await cleanUp([context.project.cwd])
    })

    it('gitTag creates a tag', async () => {
        const cwd = context.project.cwd
        await execUtils.execvp('git', ['commit', '-m "test: base"', '--allow-empty'], {
            cwd,
        })
        const newTag = 'pkg@1.0.0'
        await gitTag(newTag, { cwd, context })
        const { stdout: tagList } = await execUtils.execvp('git', ['tag', '-l'], {
            cwd,
            encoding: 'utf-8',
        })

        expect(tagList.trim().split('\n')).toEqual([newTag])
    })

    it('gitLastTaggedCommit gets last tagged commit', async () => {
        const cwd = context.project.cwd
        await execUtils.execvp('git', ['commit', '-m "test: base"', '--allow-empty'], {
            cwd,
        })
        const tag = 'pkg@1.0.0'
        await gitTag(tag, { cwd, context })
        const lastTaggedSha = await gitLastTaggedCommit({ cwd, context })
        const { stdout: actualSha } = await execUtils.execvp(
            'git',
            ['log', tag, '-1', '--pretty=%H'],
            {
                cwd,
                encoding: 'utf-8',
            },
        )

        expect(lastTaggedSha).toEqual(actualSha.trim())
    })

    it('gitPushTags pushes to remote', async () => {
        const cwd = context.project.cwd
        const upstreamContext = await setupRepo()

        await execUtils.execvp('git', ['remote', 'add', 'local', upstreamContext.project.cwd], {
            cwd,
        })
        await execUtils.execvp('git', ['commit', '-m "test: base"', '--allow-empty'], {
            cwd,
        })

        await gitTag('pkg@1.0.0', { cwd, context })
        await gitPushTags({ cwd, remote: 'local', context })

        const lastTaggedSha = await gitLastTaggedCommit({ cwd, context })

        const { stdout: remoteTags } = await execUtils.execvp(
            'git',
            ['ls-remote', '--tags', 'local'],
            {
                cwd,
                encoding: 'utf-8',
            },
        )
        await cleanUp([upstreamContext.project.cwd])

        expect(remoteTags).toEqual(expect.stringContaining(lastTaggedSha.trim()))
    })
})
