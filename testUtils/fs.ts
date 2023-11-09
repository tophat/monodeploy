import fs from 'fs/promises'
import os from 'os'
import path from 'path'

export async function createFile({
    filePath,
    content,
    cwd,
}: {
    filePath: string
    content?: string
    cwd: string
}): Promise<void> {
    const parent = path.dirname(filePath)
    const fileContent = content ?? 'some content'
    await fs.mkdir(`${cwd}/${parent}`, { recursive: true })
    await fs.writeFile(`${cwd}/${filePath}`, fileContent)
}

export async function createTempDir(): Promise<{ dir: string } & AsyncDisposable> {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'monorepo-'))
    return {
        dir,
        async [Symbol.asyncDispose]() {
            try {
                await fs.rm(dir, { recursive: true, force: true })
            } catch {}
        },
    }
}
