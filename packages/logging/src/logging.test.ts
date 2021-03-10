import { MessageName, ThrowReport } from '@yarnpkg/core'

import logging, { LOG_LEVELS } from '.'

class CollectReport extends ThrowReport {
    reportInfo(name: MessageName | null, text: string) {
        console.log(text)
    }

    reportWarning(name: MessageName, text: string) {
        console.warn(text)
    }

    reportError(name: MessageName, text: string) {
        console.error(text)
    }

    reportExceptionOnce(error: Error) {
        console.error(error)
    }
}

describe('Logging', () => {
    const origLogLevel = process.env.MONODEPLOY_LOG_LEVEL

    let report

    beforeAll(() => {
        jest.spyOn(console, 'log').mockImplementation()
        jest.spyOn(console, 'warn').mockImplementation()
        jest.spyOn(console, 'error').mockImplementation()
    })

    beforeEach(() => {
        report = new CollectReport()
    })

    afterEach(() => {
        jest.resetAllMocks()
        if (origLogLevel === undefined) {
            delete process.env.MONODEPLOY_LOG_LEVEL
        } else {
            process.env.MONODEPLOY_LOG_LEVEL = origLogLevel
        }
        logging.setDryRun(false)
    })

    it('respects log level', () => {
        process.env.MONODEPLOY_LOG_LEVEL = String(LOG_LEVELS.DEBUG)
        logging.debug('m1', { report })
        logging.info('m2', { report })
        logging.warning('m3', { report })
        logging.error('m4', { report })
        expect(console.log).toBeCalledWith(expect.stringContaining('m1'))
        expect(console.log).toBeCalledWith(expect.stringContaining('m2'))
        expect(console.warn).toBeCalledWith(expect.stringContaining('m3'))
        expect(console.error).toBeCalledWith(expect.stringContaining('m4'))

        jest.resetAllMocks()
        process.env.MONODEPLOY_LOG_LEVEL = String(LOG_LEVELS.INFO)
        logging.debug('m1', { report })
        logging.info('m2', { report })
        logging.warning('m3', { report })
        logging.error('m4', { report })
        expect(console.log).not.toBeCalledWith(expect.stringContaining('m1'))
        expect(console.log).toBeCalledWith(expect.stringContaining('m2'))
        expect(console.warn).toBeCalledWith(expect.stringContaining('m3'))
        expect(console.error).toBeCalledWith(expect.stringContaining('m4'))

        jest.resetAllMocks()
        process.env.MONODEPLOY_LOG_LEVEL = String(LOG_LEVELS.WARNING)
        logging.debug('m1', { report })
        logging.info('m2', { report })
        logging.warning('m3', { report })
        logging.error('m4', { report })
        expect(console.log).not.toBeCalledWith(expect.stringContaining('m1'))
        expect(console.log).not.toBeCalledWith(expect.stringContaining('m2'))
        expect(console.warn).toBeCalledWith(expect.stringContaining('m3'))
        expect(console.error).toBeCalledWith(expect.stringContaining('m4'))

        jest.resetAllMocks()
        process.env.MONODEPLOY_LOG_LEVEL = String(LOG_LEVELS.ERROR)
        logging.debug('m1', { report })
        logging.info('m2', { report })
        logging.warning('m3', { report })
        logging.error('m4', { report })
        expect(console.log).not.toBeCalledWith(expect.stringContaining('m1'))
        expect(console.log).not.toBeCalledWith(expect.stringContaining('m2'))
        expect(console.warn).not.toBeCalledWith(expect.stringContaining('m3'))
        expect(console.error).toBeCalledWith(expect.stringContaining('m4'))
    })

    it('prints dry run prefix when dry run configured', () => {
        process.env.MONODEPLOY_LOG_LEVEL = String(LOG_LEVELS.INFO)
        logging.setDryRun(true)
        logging.info('m1', { report })
        expect(console.log).toBeCalledWith(expect.stringContaining('m1'))
        expect(console.log).toBeCalledWith(expect.stringContaining('[Dry Run]'))

        jest.resetAllMocks()
        logging.setDryRun(false)
        logging.info('m1', { report })
        expect(console.log).toBeCalledWith(expect.stringContaining('m1'))
        expect(console.log).not.toBeCalledWith(
            expect.stringContaining('[Dry Run]'),
        )
    })

    it('defaults to log level warning', () => {
        delete process.env.MONODEPLOY_LOG_LEVEL
        logging.debug('m1', { report })
        logging.info('m2', { report })
        logging.warning('m3', { report })
        logging.error('m4', { report })
        expect(console.log).not.toBeCalledWith(expect.stringContaining('m1'))
        expect(console.log).not.toBeCalledWith(expect.stringContaining('m2'))
        expect(console.warn).toBeCalledWith(expect.stringContaining('m3'))
        expect(console.error).toBeCalledWith(expect.stringContaining('m4'))
    })

    it('falls back to log level warning', () => {
        process.env.MONODEPLOY_LOG_LEVEL = 'not-a-number'
        logging.debug('m1', { report })
        logging.info('m2', { report })
        logging.warning('m3', { report })
        logging.error('m4', { report })
        expect(console.log).not.toBeCalledWith(expect.stringContaining('m1'))
        expect(console.log).not.toBeCalledWith(expect.stringContaining('m2'))
        expect(console.warn).toBeCalledWith(expect.stringContaining('m3'))
        expect(console.error).toBeCalledWith(expect.stringContaining('m4'))
    })

    it('prints extras', () => {
        process.env.MONODEPLOY_LOG_LEVEL = String(LOG_LEVELS.INFO)
        logging.info('m1', { report, extras: 'extra info' })
        expect(console.log).toBeCalledWith(expect.stringContaining('m1'))
        expect(console.log).toBeCalledWith(
            expect.stringContaining('extra info'),
        )
    })
})
