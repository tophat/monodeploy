import { promises as fs } from 'fs'
import { dirname } from 'path'

export async function createFile({
    filePath,
    content,
    cwd,
}: {
    filePath: string
    content?: string
    cwd: string
}): Promise<void> {
    const parent = dirname(filePath)
    const fileContent = content ?? 'some content'
    await fs.mkdir(`${cwd}/${parent}`, { recursive: true })
    await fs.writeFile(`${cwd}/${filePath}`, fileContent)
}
