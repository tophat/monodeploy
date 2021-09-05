import path from 'path'

import type { ConfigFile } from './types'
import validateConfigFile from './validateConfigFile'

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
        const config: unknown = require(configId)
        const validate = validateConfigFile()
        if (validate(config)) {
            return config
        }
        throw new Error(
            `Invalid configuration:\n${validate.errors?.map(
                (err) => `  ${err.schemaPath} ${err.message}`,
            )}\n`,
        )
    } catch (err) {
        /* istanbul ignore else */
        if (err instanceof Error && err?.message) {
            throw new Error(
                `Unable to parse monodeploy config from: ${configFilename}.\n\n${err.message}`,
            )
        }

        /* istanbul ignore next: this just surfaces the original error */
        throw err
    }
}

export default readConfigFile
