import type { Octokit } from '@octokit/core'

export async function request(
    octokit: Octokit,
    ...params: Parameters<(typeof Octokit)['prototype']['request']>
) {
    return octokit.request(...params)
}
