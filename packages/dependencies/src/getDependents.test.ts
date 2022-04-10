import { promises as fs } from 'fs'

import { getMonodeployConfig, setupMonorepo } from '@monodeploy/test-utils'
import { YarnContext } from '@monodeploy/types'

import { getDependents } from '.'

describe('@monodeploy/dependencies', () => {
    let context: YarnContext

    beforeEach(async () => {
        context = await setupMonorepo({
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
    })

    afterEach(async () => {
        try {
            await fs.rm(context.project.cwd, { recursive: true, force: true })
        } catch {}
    })

    it("Determines a package' dependents properly", async () => {
        // pkg-3 depends on pkg-2, pkg-6 depends on pkg-3
        const config = await getMonodeployConfig({
            cwd: context.project.cwd,
            baseBranch: 'main',
            commitSha: 'shashasha',
        })
        const dependents = await getDependents(config, context, new Set(['pkg-2']))

        expect(dependents).toEqual(new Set(['pkg-3', 'pkg-6']))
    })

    it('Does not include dependents that are in the package list', async () => {
        // pkg-3 depends on pkg-2
        const config = await getMonodeployConfig({
            cwd: context.project.cwd,
            baseBranch: 'main',
            commitSha: 'shashasha',
        })

        const dependents = await getDependents(config, context, new Set(['pkg-2', 'pkg-3']))

        expect(dependents).toEqual(new Set(['pkg-6']))
    })

    it('Considers private dependents', async () => {
        const config = await getMonodeployConfig({
            cwd: context.project.cwd,
            baseBranch: 'main',
            commitSha: 'shashasha',
        })

        // pkg-5 is a private dependent of pk-4
        const dependents = await getDependents(config, context, new Set(['pkg-4']))
        expect(dependents).toEqual(new Set(['pkg-5']))
    })

    it('Only counts dependents once', async () => {
        const config = await getMonodeployConfig({
            cwd: context.project.cwd,
            baseBranch: 'main',
            commitSha: 'shashasha',
        })

        // pkg-6 is a dependent of both pkg-3 and pkg-7
        const dependents = await getDependents(config, context, new Set(['pkg-3', 'pkg-7']))
        expect(dependents).toEqual(new Set(['pkg-6']))
    })

    it('skips unknown package names', async () => {
        const config = await getMonodeployConfig({
            cwd: context.project.cwd,
            baseBranch: 'main',
            commitSha: 'shashasha',
        })

        // pkg-6 is a dependent of both pkg-3 and pkg-7
        const dependents = await getDependents(
            config,
            context,
            new Set(['pkg-3', 'pkg-7', 'pkg-unknown']),
        )
        expect(dependents).toEqual(new Set(['pkg-6']))
    })
})

describe('cycles', () => {
    let context: YarnContext

    beforeEach(async () => {
        context = await setupMonorepo({
            'pkg-1': { dependencies: ['pkg-2'] },
            'pkg-2': { dependencies: ['pkg-3'] },
            'pkg-3': { dependencies: ['pkg-1'] },
        })
    })

    afterEach(async () => {
        try {
            await fs.rm(context.project.cwd, { recursive: true, force: true })
        } catch {}
        jest.restoreAllMocks()
    })

    it('handles cycles', async () => {
        const config = await getMonodeployConfig({
            cwd: context.project.cwd,
            baseBranch: 'main',
            commitSha: 'shashasha',
        })
        const dependents = await getDependents(config, context, new Set(['pkg-2']))

        expect(dependents).toEqual(new Set(['pkg-1', 'pkg-3']))
    })
})

describe('complex', () => {
    it('handles cycles 1', async () => {
        let context: YarnContext | undefined = undefined
        try {
            context = await setupMonorepo({
                'pkg-1': { dependencies: ['pkg-2', 'pkg-3'] },
                'pkg-2': {
                    dependencies: ['pkg-1', 'pkg-3'],
                },
                'pkg-3': {
                    dependencies: ['pkg-1', 'pkg-2'],
                },
            })

            const config = await getMonodeployConfig({
                cwd: context.project.cwd,
                baseBranch: 'main',
                commitSha: 'shashasha',
            })
            const dependents = await getDependents(config, context, new Set(['pkg-1']))
            expect(dependents).toEqual(new Set(['pkg-2', 'pkg-3']))
        } finally {
            try {
                if (context) {
                    await fs.rm(context.project.cwd, {
                        recursive: true,
                        force: true,
                    })
                }
            } catch {}
        }
    })

    it('handles transitive dependents 1', async () => {
        let context: YarnContext | undefined = undefined
        try {
            context = await setupMonorepo({
                'pkg-1': {},
                'pkg-2': {
                    dependencies: ['pkg-1'],
                },
                'pkg-3': { dependencies: ['pkg-2'] },
                'pkg-4': { dependencies: ['pkg-3'] },
                'pkg-5': { dependencies: ['pkg-4'] },
                'pkg-isolated': {},
            })

            const config = await getMonodeployConfig({
                cwd: context.project.cwd,
                baseBranch: 'main',
                commitSha: 'shashasha',
            })
            const dependents = await getDependents(config, context, new Set(['pkg-1']))
            expect(dependents).toEqual(new Set(['pkg-2', 'pkg-3', 'pkg-4', 'pkg-5']))
        } finally {
            try {
                if (context) {
                    await fs.rm(context.project.cwd, {
                        recursive: true,
                        force: true,
                    })
                }
            } catch {}
        }
    })

    it('handles transitive dependents 2', async () => {
        let context: YarnContext | undefined = undefined
        try {
            context = await setupMonorepo({
                'pkg-1': {},
                'pkg-2': {
                    dependencies: ['pkg-1'],
                },
                'pkg-3': { dependencies: ['pkg-2', 'pkg-6'] },
                'pkg-4': { dependencies: ['pkg-2'] },
                'pkg-5': { dependencies: ['pkg-2', 'pkg-3'] },
                'pkg-6': {},
            })

            const config = await getMonodeployConfig({
                cwd: context.project.cwd,
                baseBranch: 'main',
                commitSha: 'shashasha',
            })
            const dependents = await getDependents(config, context, new Set(['pkg-2', 'pkg-3']))
            expect(dependents).toEqual(new Set(['pkg-4', 'pkg-5']))
        } finally {
            try {
                if (context) {
                    await fs.rm(context.project.cwd, {
                        recursive: true,
                        force: true,
                    })
                }
            } catch {}
        }
    })
})
