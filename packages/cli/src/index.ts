import { Writable } from 'stream'

import { cli } from './cli'

// MONODEPLOY_DISABLE_LOGS is used to simplify monodeploy tests
const enableLogs = !process.env.MONODEPLOY_DISABLE_LOGS

const throwAwayStream = () =>
    new Writable({
        write(_chunk, _encoding, callback) {
            callback()
        },
    })

cli.run(process.argv.slice(2), {
    stderr: enableLogs ? process.stderr : throwAwayStream(),
    stdout: enableLogs ? process.stdout : throwAwayStream(),
}).then((exitCode) => {
    if (!process.env.MONODEPLOY_SUPPRESS_EXIT_CODE) {
        process.exitCode = exitCode
    }
})
