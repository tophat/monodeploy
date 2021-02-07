import { execSync } from 'child_process'
import { promises as fs } from 'fs'

import { getCommitMessages, gitDiffTree, gitResolveSha } from '.'

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

    it('getCommitMessages gets commit messages', async () => {
        const testPath = await setupTestRepository()

        // Create some files and commit them to have a diff.
        await fs.writeFile(`${testPath}/test.txt`, 'wowfile')
        await execSync('git commit -m "test: base" --allow-empty', {
            cwd: testPath,
        })
        await execSync('git checkout -b test-branch', { cwd: testPath })
        const commitMessage = 'test: test file'
        await execSync(`git add . && git commit -m "${commitMessage}" -n`, {
            cwd: testPath,
        })
        const headSha = execSync('git rev-parse HEAD', {
            cwd: testPath,
            encoding: 'utf8',
        }).trim()

        const messages = await getCommitMessages({
            cwd: testPath,
            git: { baseBranch: 'master', commitSha: headSha },
        })

        await cleanUp([testPath])
        expect(messages).toEqual([
            { sha: headSha, body: `${commitMessage}\n\n` },
        ])
    })
})
