import path from 'path'

import { ConfigFile } from './types'

const resolvePath = (filename: string, cwd: string): string => {
    if (filename.startsWith(`.${path.sep}`) || filename.startsWith(path.sep)) {
        return require.resolve(filename, { paths: [cwd] })
    }
    return require.resolve(`.${path.sep}${filename}`, { paths: [cwd] })
}

const readConfigFile = async (
    configFilename: string,
    { cwd }: { cwd: string },
): Promise<ConfigFile> => {
    try {
        const configId = resolvePath(configFilename, cwd)
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const config = require(configId) as ConfigFile
        return config
    } catch (err) {
        /* istanbul ignore else */
        if (err?.message) {
            throw new Error(
                `Unable to parse monodeploy config from: ${configFilename}.\n\n${err.message}`,
            )
        }

        /* istanbul ignore next: this just surfaces the original error */
        throw err
    }
}

export default readConfigFile
