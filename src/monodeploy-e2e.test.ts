import http from 'http'
import path from 'path'

import monodeploy from './monodeploy'
import type { MonodeployConfiguration } from './types'

const RUN_E2E = process.env.E2E === '1'

const testConnection = url =>
    new Promise((resolve, reject) => {
        http.get(url, res => {
            if (res.statusCode >= 200 && res.statusCode < 500) {
                return resolve()
            }
            return reject(new Error(`Unable to connect to ${url}`))
        })
    })

describe('Monodeploy End-to-end w/ Registry', () => {
    const teste2e = RUN_E2E ? it : it.skip
    if (teste2e === it.skip) teste2e.todo = it.todo

    const monodeployConfig: MonodeployConfiguration = {
        cwd: path.resolve(process.cwd(), 'example-monorepo'),
        dryRun: true, // must stay in dry run unless git is mocked out
        git: {
            baseBranch: 'master',
            commitSha: 'HEAD',
            remote: 'origin',
        },
        access: 'public',
    }

    beforeAll(async () => {
        // Initialize docker
        if (RUN_E2E) {
            await testConnection('http://0.0.0.0:4873/')
        }

        process.env.MONODEPLOY_LOG_LEVEL = 0
    })

    afterAll(() => {
        delete process.env.MONODEPLOY_LOG_LEVEL
    })

    it('passes', () => expect(true).toBe(true))

    teste2e('does not publish if no changes detected', async () => {
        await monodeploy(monodeployConfig)
    })

    teste2e.todo('publishes only changed workspaces and dependants')
})
