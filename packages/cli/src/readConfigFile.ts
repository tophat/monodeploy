import { ConfigFile } from './types'

const readConfigFile = async (
    configFilename: string,
    { cwd }: { cwd: string },
): Promise<ConfigFile> => {
    try {
        const configId = require.resolve(configFilename, { paths: [cwd] })
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
