import Ajv, { SchemaObject, ValidateFunction } from 'ajv'

import type { ConfigFile } from './types'

const ajv = new Ajv({ allowUnionTypes: true })

const schema: SchemaObject = {
    type: 'object',
    properties: {
        registryUrl: { type: 'string', nullable: true },
        noRegistry: { type: 'boolean', nullable: true },
        dryRun: { type: 'boolean', nullable: true },
        conventionalChangelogConfig: {
            type: ['string', 'object'],
            nullable: true,
            oneOf: [
                {
                    type: 'object',
                    required: ['name'],
                    properties: { name: { type: 'string' } },
                    additionalProperties: true,
                },
                { type: 'string' },
            ],
        },
        changesetFilename: { type: 'string', nullable: true },
        changelogFilename: { type: 'string', nullable: true },
        changesetIgnorePatterns: {
            type: 'array',
            nullable: true,
            items: { type: 'string' },
        },
        commitIgnorePatterns: {
            type: 'array',
            nullable: true,
            items: { type: 'string' },
        },
        forceWriteChangeFiles: { type: 'boolean', nullable: true },
        access: {
            type: 'string',
            nullable: true,
            enum: ['infer', 'public', 'restricted'],
        },
        persistVersions: { type: 'boolean', nullable: true },
        topological: { type: 'boolean', nullable: true },
        topologicalDev: { type: 'boolean', nullable: true },
        jobs: { type: 'integer', nullable: true },
        maxConcurrentReads: { type: 'integer', nullable: true },
        maxConcurrentWrites: { type: 'integer', nullable: true },
        autoCommit: { type: 'boolean', nullable: true },
        autoCommitMessage: { type: 'string', nullable: true },
        git: {
            type: 'object',
            properties: {
                baseBranch: { type: 'string', nullable: true },
                commitSha: { type: 'string', nullable: true },
                remote: { type: 'string', nullable: true },
                push: { type: 'boolean', nullable: true },
                tag: { type: 'boolean', nullable: true },
            },
            required: [],
            additionalProperties: false,
            nullable: true,
        },
        plugins: { type: 'array', nullable: true, items: { type: 'string' } },
        prerelease: { type: 'boolean', nullable: true },
        prereleaseId: { type: 'string', nullable: true },
        prereleaseNPMTag: { type: 'string', nullable: true },
    },
    required: [],
    additionalProperties: false,
}

export default (): ValidateFunction<ConfigFile> => ajv.compile(schema)
