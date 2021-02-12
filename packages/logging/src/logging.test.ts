import logging, { LOG_LEVELS } from '.'

describe('Logging', () => {
    const origLogLevel = process.env.MONODEPLOY_LOG_LEVEL

    beforeAll(() => {
        jest.spyOn(console, 'log').mockImplementation()
        jest.spyOn(console, 'error').mockImplementation()
    })

    afterEach(() => {
        jest.resetAllMocks()
        process.env.MONODEPLOY_LOG_LEVEL = origLogLevel
        logging.setDryRun(false)
    })

    it('respects log level', () => {
        process.env.MONODEPLOY_LOG_LEVEL = LOG_LEVELS.DEBUG
        logging.debug('m1')
        logging.info('m2')
        logging.warning('m3')
        logging.error('m4')
        expect(console.log).toBeCalledWith(expect.stringContaining('m1'))
        expect(console.log).toBeCalledWith(expect.stringContaining('m2'))
        expect(console.error).toBeCalledWith(expect.stringContaining('m3'))
        expect(console.error).toBeCalledWith(expect.stringContaining('m4'))

        jest.resetAllMocks()
        process.env.MONODEPLOY_LOG_LEVEL = LOG_LEVELS.INFO
        logging.debug('m1')
        logging.info('m2')
        logging.warning('m3')
        logging.error('m4')
        expect(console.log).not.toBeCalledWith(expect.stringContaining('m1'))
        expect(console.log).toBeCalledWith(expect.stringContaining('m2'))
        expect(console.error).toBeCalledWith(expect.stringContaining('m3'))
        expect(console.error).toBeCalledWith(expect.stringContaining('m4'))

        jest.resetAllMocks()
        process.env.MONODEPLOY_LOG_LEVEL = LOG_LEVELS.WARNING
        logging.debug('m1')
        logging.info('m2')
        logging.warning('m3')
        logging.error('m4')
        expect(console.log).not.toBeCalledWith(expect.stringContaining('m1'))
        expect(console.log).not.toBeCalledWith(expect.stringContaining('m2'))
        expect(console.error).toBeCalledWith(expect.stringContaining('m3'))
        expect(console.error).toBeCalledWith(expect.stringContaining('m4'))

        jest.resetAllMocks()
        process.env.MONODEPLOY_LOG_LEVEL = LOG_LEVELS.ERROR
        logging.debug('m1')
        logging.info('m2')
        logging.warning('m3')
        logging.error('m4')
        expect(console.log).not.toBeCalledWith(expect.stringContaining('m1'))
        expect(console.log).not.toBeCalledWith(expect.stringContaining('m2'))
        expect(console.error).not.toBeCalledWith(expect.stringContaining('m3'))
        expect(console.error).toBeCalledWith(expect.stringContaining('m4'))
    })

    it('prints dry run prefix when dry run configured', () => {
        logging.setDryRun(true)
        logging.info('m1')
        expect(console.log).toBeCalledWith(expect.stringContaining('m1'))
        expect(console.log).toBeCalledWith(expect.stringContaining('[Dry Run]'))

        jest.resetAllMocks()
        logging.setDryRun(false)
        logging.info('m1')
        expect(console.log).toBeCalledWith(expect.stringContaining('m1'))
        expect(console.log).not.toBeCalledWith(
            expect.stringContaining('[Dry Run]'),
        )
    })

    it('prints all args', () => {
        logging.info('m1', 'm2', 'm3')
        expect(console.log).toBeCalledWith(expect.stringContaining('m1'))
        expect(console.log).toBeCalledWith(expect.stringContaining('m2'))
        expect(console.log).toBeCalledWith(expect.stringContaining('m3'))
    })
})
