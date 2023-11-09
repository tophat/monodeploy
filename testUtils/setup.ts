// eslint-disable-next-line @typescript-eslint/ban-ts-comment, @typescript-eslint/prefer-ts-expect-error
// @ts-ignore dispose polyfill
Symbol.dispose ??= Symbol.for('Symbol.dispose')
// eslint-disable-next-line @typescript-eslint/ban-ts-comment, @typescript-eslint/prefer-ts-expect-error
// @ts-ignore dispose polyfill
Symbol.asyncDispose ??= Symbol.for('Symbol.asyncDispose')

process.env.MONODEPLOY_DISABLE_LOGS = '1'
