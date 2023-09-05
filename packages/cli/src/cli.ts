import { Cli } from 'clipanion'

import { MonodeployCommand } from './command/default'

const cli = new Cli({
    binaryLabel: 'Monodeploy',
    binaryName: 'yarn monodeploy',
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    binaryVersion: require('../package.json').version,
})

cli.register(MonodeployCommand)

export { cli }
