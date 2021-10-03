import { exec } from '@monodeploy/io'
import { cleanUp, initGitRepository, setupMonorepo } from '@monodeploy/test-utils'
import { YarnContext } from '@monodeploy/types'

import { gitLastTaggedCommit, gitPushTags, gitTag } from '.'

jest.mock('@monodeploy/logging')

const setupRepo = async () => {
    const context: YarnContext = await setupMonorepo({
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
        await exec('git commit -m "test: base" --allow-empty', {
            cwd,
        })
        const newTag = 'pkg@1.0.0'
        await gitTag(newTag, { cwd, context })
        const tagList = (
            await exec('git tag -l', {
                cwd,
            })
        ).stdout

        expect(tagList.trim().split('\n')).toEqual([newTag])
    })

    it('gitLastTaggedCommit gets last tagged commit', async () => {
        const cwd = context.project.cwd
        await exec('git commit -m "test: base" --allow-empty', {
            cwd,
        })
        const tag = 'pkg@1.0.0'
        await gitTag(tag, { cwd, context })
        const lastTaggedSha = await gitLastTaggedCommit({ cwd, context })
        const actualSha = (
            await exec(`git log ${tag} -1 --pretty=%H`, {
                cwd,
            })
        ).stdout

        expect(lastTaggedSha).toEqual(actualSha.trim())
    })

    it('gitPushTags pushes to remote', async () => {
        const cwd = context.project.cwd
        const upstreamContext = await setupRepo()

        await exec(`git remote add local ${upstreamContext.project.cwd}`, { cwd })
        await exec('git commit -m "test: base" --allow-empty', {
            cwd,
        })

        await gitTag('pkg@1.0.0', { cwd, context })
        await gitPushTags({ cwd, remote: 'local', context })

        const lastTaggedSha = await gitLastTaggedCommit({ cwd, context })

        const remoteTags = (
            await exec('git ls-remote --tags local', {
                cwd,
            })
        ).stdout
        await cleanUp([upstreamContext.project.cwd])

        expect(remoteTags).toEqual(expect.stringContaining(lastTaggedSha.trim()))
    })
})
