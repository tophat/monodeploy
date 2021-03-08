import { execSync } from 'child_process'

import { cleanUp, setupTestRepository } from '@monodeploy/test-utils'

import { gitLastTaggedCommit, gitPush, gitTag } from '.'

jest.mock('monodeploy-logging')

describe('monodeploy-git (mocked invariants)', () => {
    let tempRepositoryRoot

    beforeEach(async () => {
        tempRepositoryRoot = await setupTestRepository()
    })

    afterEach(async () => {
        jest.restoreAllMocks()
        await cleanUp([tempRepositoryRoot])
    })

    it('gitTag creates a tag', async () => {
        const cwd = tempRepositoryRoot
        execSync('git commit -m "test: base" --allow-empty', {
            cwd,
        })
        const newTag = '1.0.0'
        await gitTag(newTag, { cwd })
        const tagList = execSync('git tag -l', {
            cwd,
            encoding: 'utf8',
        })

        expect(tagList.trim().split('\n')).toEqual([newTag])
    })

    it('gitLastTaggedCommit gets last tagged commit', async () => {
        const cwd = tempRepositoryRoot
        execSync('git commit -m "test: base" --allow-empty', {
            cwd,
        })
        const tag = '1.0.0'
        await gitTag(tag, { cwd })
        const lastTaggedSha = await gitLastTaggedCommit({ cwd })
        const actualSha = execSync(`git log ${tag} -1 --pretty=%H`, {
            cwd,
            encoding: 'utf-8',
        })

        expect(lastTaggedSha).toEqual(actualSha.trim())
    })

    it('gitPush pushes to remote', async () => {
        const cwd = tempRepositoryRoot
        const tempUpstream = await setupTestRepository()
        execSync(`git remote add local ${tempUpstream}`, { cwd })
        execSync('git commit -m "test: base" --allow-empty', {
            cwd,
        })

        await gitTag('1.0.0', { cwd })
        await gitPush('1.0.0', { cwd, remote: 'local' })

        const lastTaggedSha = await gitLastTaggedCommit({ cwd })

        const remoteTags = execSync('git ls-remote --tags local', {
            cwd,
            encoding: 'utf8',
        })
        await cleanUp([tempUpstream])

        expect(remoteTags).toEqual(
            expect.stringContaining(lastTaggedSha.trim()),
        )
    })
})
