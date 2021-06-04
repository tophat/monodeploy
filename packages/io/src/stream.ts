import { Readable } from 'stream'

export const readStream = <T>(stream: Readable): Promise<T[]> =>
    new Promise((resolve) => {
        const chunks: T[] = []
        stream.on('data', (chunk) => chunks.push(chunk))
        stream.on('end', () => resolve(chunks))
    })

export const readStreamString = (stream: Readable): Promise<string> =>
    new Promise((resolve) => {
        const chunks: string[] = []
        stream.on('data', (chunk) => chunks.push(chunk))
        stream.on('end', () => resolve(chunks.join('')))
    })
