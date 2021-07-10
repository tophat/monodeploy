import path from 'path'

import type { MonodeployConfiguration } from '@monodeploy/types'

import { resolveConventionalConfig } from '.'

describe('resolveConventionalConfig', () => {
    it('throw when no conventional changelog config provided', async () => {
        await expect(
            resolveConventionalConfig({} as MonodeployConfiguration),
        ).rejects.toThrow()
    })

    it('resolves custom conventional config preset', async () => {
        const monodeployConfig: Pick<
            MonodeployConfiguration,
            'cwd' | 'conventionalChangelogConfig'
        > = {
            cwd: process.cwd(),
            conventionalChangelogConfig: path.resolve(
                path.join(
                    __dirname,
                    '..',
                    'mocks',
                    'conventional-config-fn.mock.ts',
                ),
            ),
        }

        const config = await resolveConventionalConfig(
            monodeployConfig as MonodeployConfiguration,
        )

        expect(config).toMatchInlineSnapshot(`
            Object {
              "parserOpts": Object {},
              "recommendedBumpOpts": Object {
                "whatBump": [Function],
              },
            }
        `)
    })

    it('supports custom conventional config preset with additional configuration', async () => {
        const COMMENT_CHAR = '#'
        const monodeployConfig: Pick<
            MonodeployConfiguration,
            'cwd' | 'conventionalChangelogConfig'
        > = {
            cwd: process.cwd(),
            conventionalChangelogConfig: {
                name: path.resolve(
                    path.join(
                        __dirname,
                        '..',
                        'mocks',
                        'conventional-config-fn.mock.ts',
                    ),
                ),
                commentChar: COMMENT_CHAR,
            },
        }

        const config = await resolveConventionalConfig(
            monodeployConfig as MonodeployConfiguration,
        )

        expect(config).toMatchObject({
            parserOpts: {
                commentChar: COMMENT_CHAR,
            },
        })
    })
})
