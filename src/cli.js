const yargs = require('yargs')

const monodeploy = require('./index')

const { argv } = yargs
    .option('registry-url', {
        type: 'string',
        description: 'The URL of the registry to publish to',
        requiresArg: true,
    })
    .option('changelog-preset', {
        type: 'string',
        description: 'Name of the package to use as changelog preset',
        requiresArg: true,
    })
    .option('latest-versions-file', {
        type: 'string',
        description: 'Path to a file where package information will be written',
        requiresArg: true,
    })
    .demandCommand(0, 0)
    .strict()
    .wrap(yargs.terminalWidth())

monodeploy(argv).catch(e => {
    console.error(e)
    process.exit(1)
})
