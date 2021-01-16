// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const prettyPrintMap = (arg: Map<any, any>): string => {
    return JSON.stringify(Object.fromEntries(arg.entries()), null, 2)
}
