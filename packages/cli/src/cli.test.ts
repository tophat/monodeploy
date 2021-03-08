import path from 'path'

import monodeploy from '@monodeploy/node'

const scriptPath = path.join(__dirname, 'cli.ts')

jest.mock('@monodeploy/node', () => ({
    __esModule: true,
    default: jest.fn(),
}))

describe('CLI', () => {
    const origArgs = process.argv

    afterAll(() => {
        process.argv = origArgs
    })

    afterEach(() => {
        // eslint-disable-next-line prettier/prettier
        (monodeploy as jest.MockedFunction<typeof monodeploy>).mockClear();
    })

    const setArgs = command => {
        process.argv = command
            ? ['node', scriptPath, ...command.split(' ')]
            : ['node', scriptPath]
    }

    it('passes cli flags to monodeploy', async () => {
        setArgs(
            '--registry-url http://example.com --cwd /tmp --dry-run ' +
                '--git-base-branch master --git-commit-sha HEAD --git-remote origin ' +
                '--log-level 0 --conventional-changelog-config @my/config ' +
                '--changeset-filename changes.json --prepend-changelog changelog.md --force-write-change-files ' +
                '--push --persist-versions --access public --topological --topological-dev --jobs 6',
        )
        jest.isolateModules(() => {
            require('./cli')
        })
        expect(
            (monodeploy as jest.MockedFunction<typeof monodeploy>).mock
                .calls[0][0],
        ).toMatchInlineSnapshot(`
            Object {
              "access": "public",
              "changelogFilename": "changelog.md",
              "changesetFilename": "changes.json",
              "conventionalChangelogConfig": "@my/config",
              "cwd": "/tmp",
              "dryRun": true,
              "forceWriteChangeFiles": true,
              "git": Object {
                "baseBranch": "master",
                "commitSha": "HEAD",
                "push": true,
                "remote": "origin",
              },
              "jobs": 6,
              "persistVersions": true,
              "registryUrl": "http://example.com",
              "topological": true,
              "topologicalDev": true,
            }
        `)
    })

    it('passes empty config if no cli flags set', async () => {
        setArgs('')
        jest.isolateModules(() => {
            require('./cli')
        })
        expect(
            (monodeploy as jest.MockedFunction<typeof monodeploy>).mock
                .calls[0][0],
        ).toMatchInlineSnapshot(`
            Object {
              "access": undefined,
              "changelogFilename": undefined,
              "changesetFilename": undefined,
              "conventionalChangelogConfig": undefined,
              "cwd": undefined,
              "dryRun": undefined,
              "forceWriteChangeFiles": false,
              "git": Object {
                "baseBranch": undefined,
                "commitSha": undefined,
                "push": false,
                "remote": undefined,
              },
              "jobs": 0,
              "persistVersions": false,
              "registryUrl": undefined,
              "topological": false,
              "topologicalDev": false,
            }
        `)
    })

    it('sets exit code to error if monodeploy throws', async () => {
        const prevExitCode = process.exitCode ?? 0
        const spyError = jest.spyOn(console, 'error').mockImplementation(() => {
            /* ignore */
        })
        const error = new Error('Monodeploy failed.')
        ;(monodeploy as jest.MockedFunction<
            typeof monodeploy
        >).mockImplementation(() => {
            throw error
        })
        setArgs('')
        jest.isolateModules(() => {
            require('./cli')
        })
        expect(spyError).toHaveBeenCalledWith(error)
        expect(process.exitCode).toEqual(1)
        spyError.mockRestore()
        process.exitCode = prevExitCode
    })
})
