import * as TypeDoc from 'typedoc'

async function main() {
    const app = await TypeDoc.Application.bootstrapWithPlugins(
        {
            // typedoc options here
            entryPoints: ['./src/types.ts'],
            exclude: [],
            jsDocCompatibility: {
                defaultTag: false,
            },
        },
        [
            // If you want TypeDoc to load tsconfig.json / typedoc.json files
            new TypeDoc.TSConfigReader(),
            new TypeDoc.TypeDocReader(),
        ],
    )

    const project = await app.convert()

    if (project) {
        // Project may not have converted correctly
        const outputDir = 'docs'

        // Alternatively generate JSON output
        await app.generateJson(project, `${outputDir}/documentation.json`)
    }
}

main().catch(console.error)
