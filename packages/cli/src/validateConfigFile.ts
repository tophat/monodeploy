import Ajv, { JSONSchemaType, ValidateFunction } from 'ajv'

import type { ConfigFile } from './types'

const ajv = new Ajv({
    logger: {
        log: console.log.bind(console),
        warn: console.warn.bind(console),
        error: console.error.bind(console),
    },
})

const schema: JSONSchemaType<ConfigFile> = {
    type: 'object',
    properties: {
        registryUrl: { type: 'string', nullable: true },
        noRegistry: { type: 'boolean', nullable: true },
        dryRun: { type: 'boolean', nullable: true },
        conventionalChangelogConfig: { type: 'string', nullable: true },
        changesetFilename: { type: 'string', nullable: true },
        changelogFilename: { type: 'string', nullable: true },
        forceWriteChangeFiles: { type: 'boolean', nullable: true },
        access: { type: 'string', nullable: true },
        persistVersions: { type: 'boolean', nullable: true },
        topological: { type: 'boolean', nullable: true },
        topologicalDev: { type: 'boolean', nullable: true },
        jobs: { type: 'integer', nullable: true },
        git: {
            type: 'object',
            properties: {
                baseBranch: { type: 'string', nullable: true },
                commitSha: { type: 'string', nullable: true },
                remote: { type: 'string', nullable: true },
                push: { type: 'boolean', nullable: true },
            },
            required: [],
            additionalProperties: false,
            nullable: true,
        },
    },
    required: [],
    additionalProperties: false,
}

export default (): ValidateFunction<ConfigFile> => ajv.compile(schema)
