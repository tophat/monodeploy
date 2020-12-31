import http from 'http'

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

    beforeAll(async () => {
        // Initialize docker
        if (RUN_E2E) {
            await testConnection('http://0.0.0.0:4873/')
        }
    })

    afterAll(() => {
        // Cleanup docker
    })

    it('passes', () => expect(true).toBe(true))

    teste2e('does not publish if no changes detected', () => {
        expect(true).toBe(true)
    })
    teste2e('publishes only changed workspaces and dependants', () => {
        expect(true).toBe(true)
    })
})
