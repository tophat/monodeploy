/* eslint-disable @typescript-eslint/no-var-requires */

import { structUtils } from '@yarnpkg/core'
import { type PortablePath, npath, ppath } from '@yarnpkg/fslib'

import type { ConfigFile } from '../../types'

import validateConfigFile from './validateConfigFile'

class ResolveFailure extends Error {}

const DEFAULT_CONFIG_FILENAME = 'monodeploy.config.js'

const resolvePath = (name: string, cwd: PortablePath): string => {
    try {
        const nCwd = npath.fromPortablePath(cwd)

        if (structUtils.tryParseIdent(name)) {
            try {
                return require.resolve(name, { paths: [nCwd] })
            } catch {}
        }

        const absPath = ppath.resolve(cwd, npath.toPortablePath(name))
        return require.resolve(npath.fromPortablePath(absPath), { paths: [nCwd] })
    } catch (err) {
        throw new ResolveFailure(String(err))
    }
}

const merge = (base: any, overrides: any): any => {
    if (overrides === undefined && base === undefined) return undefined
    if (overrides !== undefined && base === undefined) return overrides
    if (overrides === undefined && base !== undefined) return base

    // we don't handle merging different types (like string and arrays)
    if (typeof base !== typeof overrides) return overrides

    if (base && typeof base === 'object' && !Array.isArray(base)) {
        // an object like "git: {...}"
        const merged: any = { ...base }
        for (const key in overrides) {
            const newValue = merge(base[key], overrides[key])
            if (newValue !== undefined) {
                merged[key] = newValue
            }
        }
        return merged
    }

    return overrides
}

const loadPresetConfig = (presetPath: string | null, cwd: PortablePath) => {
    if (presetPath) {
        if (presetPath.startsWith('monodeploy/')) {
            switch (presetPath.split('/')[1]) {
                case 'preset-recommended':
                    return require('../../presets/recommended')
                default:
                    break
            }
        }
        return require(resolvePath(presetPath, cwd))
    }

    return null
}

const readConfigFile = async (
    configName: string | undefined,
    { cwd, preset }: { cwd: PortablePath; preset: string | undefined },
): Promise<ConfigFile | undefined> => {
    const configPath = configName ?? DEFAULT_CONFIG_FILENAME
    try {
        const configId = resolvePath(configPath, cwd)
        const fileConfig: unknown = require(configId)
        const presetPath: string | null = (preset ?? (fileConfig as any)?.preset) || null
        const presetConfig: unknown = loadPresetConfig(presetPath, cwd)

        const config = merge(presetConfig, fileConfig)
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
        if (err instanceof ResolveFailure && !configName) {
            // unable to find "default" config file, ignoring
            return undefined
        }

        /* istanbul ignore else */
        if (err instanceof Error && err?.message) {
            throw new Error(
                `Unable to parse monodeploy config from '${configPath}'.\n\n${err.message}`,
            )
        }

        /* istanbul ignore next: this just surfaces the original error */
        throw err
    }
}

export default readConfigFile
