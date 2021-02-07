import { execSync } from 'child_process'
import { promises as fs } from 'fs'

import { gitDiffTree, gitResolveSha } from '.'

async function setupTestRepository(): string {
    const tempRoot = await fs.mkdtemp('test-repository-')
    execSync('git init', { cwd: tempRoot, encoding: 'utf8' })
    return tempRoot
}

async function cleanUp(paths: string[]) {
    await Promise.all(paths.map(path => fs.rmdir(path, { recursive: true })))
}

describe('monodeploy-git', () => {
    it('gitDiffTree returns list of modified files', async () => {
        const testPath = await setupTestRepository()

        // Create some files and commit them to have a diff.
        await fs.writeFile(`${testPath}/test.txt`, 'wowfile')
        await fs.mkdir(`${testPath}/testDir`)
        await fs.writeFile(`${testPath}/testDir/test.txt`, 'wowfile')
        await execSync('git add . && git commit -m "test: test file" -n', {
            cwd: testPath,
        })
        const headSha = execSync('git rev-parse HEAD', {
            cwd: testPath,
            encoding: 'utf8',
        })

        const diffTreeOutput = await gitDiffTree(headSha, { cwd: testPath })

        await cleanUp([testPath])

        expect(diffTreeOutput.trim()).toEqual(
            ['test.txt', 'testDir/test.txt'].join('\n'),
        )
    })

    it('gitResolveSha resolves HEAD properly', async () => {
        const testPath = await setupTestRepository()

        // Create some files and commit them to have a diff.
        await fs.writeFile(`${testPath}/test.txt`, 'wowfile')
        await execSync('git add . && git commit -m "test: test file" -n', {
            cwd: testPath,
        })
        const headSha = execSync('git rev-parse HEAD', {
            cwd: testPath,
            encoding: 'utf8',
        })

        const resolvedHead = await gitResolveSha('HEAD', { cwd: testPath })

        await cleanUp([testPath])

        expect(resolvedHead).toEqual(headSha.trim())
    })
})
