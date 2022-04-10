import * as TypeDoc from 'typedoc'

async function main() {
    const app = new TypeDoc.Application()

    // If you want TypeDoc to load tsconfig.json / typedoc.json files
    app.options.addReader(new TypeDoc.TSConfigReader())
    app.options.addReader(new TypeDoc.TypeDocReader())

    app.bootstrap({
        // typedoc options here
        entryPoints: ['./src/types.ts'],
        exclude: [],
    })

    const project = app.convert()

    if (project) {
        // Project may not have converted correctly
        const outputDir = 'docs'

        // Alternatively generate JSON output
        await app.generateJson(project, `${outputDir}/documentation.json`)
    }
}

main().catch(console.error)
