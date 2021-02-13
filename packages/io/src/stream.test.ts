import { Readable } from 'stream'

import { readStream, readStreamString } from './stream'

describe('Stream to Chunks', () => {
    it('flushes a stream to an array of chunks', async () => {
        const original = [1, { key: 'value' }, 3]

        const stream = Readable.from(original)
        expect(stream).not.toEqual(original)

        const transformed = await readStream(stream)
        expect(transformed).toEqual(original)
    })
})

describe('Stream to String', () => {
    it('flushes a stream to a string', async () => {
        const original = 'this is a sentence'

        const stream = Readable.from([
            original.substring(0, 5),
            original.substring(5),
        ])
        expect(stream).not.toEqual(original)

        const transformed = await readStreamString(stream)
        expect(transformed).toEqual(original)
    })
})
