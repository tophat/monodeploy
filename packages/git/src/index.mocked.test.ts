import { execSync } from 'child_process'
import { promises as fs } from 'fs'

import { gitLastTaggedCommit, gitTag } from '.'

jest.mock('monodeploy-logging')

describe('monodeploy-git (mocked invariants)', () => {
    let tempRepositoryRoot
    async function setupTestRepository(): string {
        const rootPath = await fs.mkdtemp(path.join(os.tmpdir(), 'test-repository-'))
        execSync('git init', { cwd: rootPath, encoding: 'utf8' })
        return rootPath
    }

    async function cleanUp(paths: string[]) {
        await Promise.all(
            paths.map(path => fs.rmdir(path, { recursive: true })),
        )
    }

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
})
