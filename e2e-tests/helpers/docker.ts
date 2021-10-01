import http from 'http'

import { execUtils } from '@yarnpkg/core'
import { ppath } from '@yarnpkg/fslib'

const isUp = (): Promise<void> =>
    new Promise((resolve, reject) => {
        try {
            http.get('http://localhost:4873/-/whoami', { timeout: 2000 }, (res) => {
                res.resume()
                if (res.statusCode === 200) {
                    return resolve()
                }
                return reject(new Error('Request failed.'))
            }).on('error', (err) => {
                reject(err)
            })
        } catch (err) {
            reject(err)
        }
    })

export async function waitForRegistry(timeout = 20000): Promise<boolean> {
    console.log('Waiting for registry to start up...')

    const DELAY = 1000
    const startTime = Date.now()
    while (Date.now() - startTime < timeout) {
        try {
            await isUp()
            return true
        } catch {}
        console.log(`Registry container is not running, waiting ${DELAY} ms...`)
        await new Promise((r) => setTimeout(r, DELAY))
    }

    throw new Error(`Registry not started. Timed out after ${Date.now() - startTime} ms.`)
}

export async function stopRegistry(): Promise<void> {
    const { stderr } = await execUtils.execvp(
        'yarn',
        ['workspace', '@monodeploy/e2e-tests', 'test:registry:stop'],
        { encoding: 'utf-8', cwd: ppath.cwd() },
    )
    if (stderr) console.error(stderr)
}

export async function startRegistry(): Promise<void> {
    const { stderr } = await execUtils.execvp(
        'yarn',
        ['workspace', '@monodeploy/e2e-tests', 'test:registry:start'],
        { encoding: 'utf-8', cwd: ppath.cwd() },
    )
    if (stderr) console.error(stderr)
}
