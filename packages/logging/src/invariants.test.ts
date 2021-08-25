import { assertProduction, assertProductionOrTest } from './invariants'

describe('Invariants', () => {
    const origNodeEnv = process.env.NODE_ENV

    afterEach(() => {
        process.env.NODE_ENV = origNodeEnv
    })

    describe('assertProduction', () => {
        it.each(['test', 'development'])('raises violation in %s', (env) => {
            process.env.NODE_ENV = env
            expect(() => assertProduction()).toThrow(/Invariant Violation/)
        })

        it('does not raise violation in production', () => {
            process.env.NODE_ENV = 'production'
            expect(() => assertProduction()).not.toThrow(/Invariant Violation/)
        })

        it('does not raise violation if node env not set', () => {
            delete process.env.NODE_ENV
            expect(() => assertProduction()).not.toThrow(/Invariant Violation/)
        })
    })

    describe('assertProductionOrTest', () => {
        it('raises violation in development', () => {
            process.env.NODE_ENV = 'development'
            expect(() => assertProductionOrTest()).toThrow(/Invariant Violation/)
        })

        it.each(['test', 'production'])('does not raise violation in %s', (env) => {
            process.env.NODE_ENV = env
            expect(() => assertProductionOrTest()).not.toThrow(/Invariant Violation/)
        })

        it('does not raise violation if node env not set', () => {
            delete process.env.NODE_ENV
            expect(() => assertProductionOrTest()).not.toThrow(/Invariant Violation/)
        })
    })
})
