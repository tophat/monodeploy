import { Readable } from 'stream'

import { readStream } from './stream'

describe('Stream to Chunks', () => {
    it('flushes a stream to an array of chunks', async () => {
        const original = [1, { key: 'value' }, 3]

        const stream = Readable.from(original)
        expect(stream).not.toEqual(original)

        const transformed = await readStream(stream)
        expect(transformed).toEqual(original)
    })
})
