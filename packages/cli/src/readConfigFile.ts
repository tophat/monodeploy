import { structUtils } from '@yarnpkg/core'
import { PortablePath, npath, ppath } from '@yarnpkg/fslib'

import type { ConfigFile } from './types'
import validateConfigFile from './validateConfigFile'

const resolvePath = (name: string, cwd: PortablePath): string => {
    const nCwd = npath.fromPortablePath(cwd)

    if (structUtils.tryParseIdent(name)) {
        try {
            return require.resolve(name, { paths: [nCwd] })
        } catch {}
    }

    const absPath = ppath.resolve(cwd, npath.toPortablePath(name))
    return require.resolve(npath.fromPortablePath(absPath), { paths: [nCwd] })
}

const readConfigFile = async (
    configName: string,
    { cwd }: { cwd: PortablePath },
): Promise<ConfigFile> => {
    try {
        const configId = resolvePath(configName, cwd)
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
                `Unable to parse monodeploy config from: ${configName}.\n\n${err.message}`,
            )
        }

        /* istanbul ignore next: this just surfaces the original error */
        throw err
    }
}

export default readConfigFile
