const actualModule = jest.requireActual('monodeploy-git')

const gitRemote = {
    tags: [],
    diffPaths: [],
}

const _reset_ = (): void => {
    gitRemote.tags = []
    // TODO: This can likely be consolidated so that paths / commits aren't stored so crudely.
    gitRemote.diffPaths = []
    gitRemote.commits = []
}

const _commitFiles_ = (sha: string, commit: string, files: string[]): void => {
    gitRemote.diffPaths = [...gitRemote.diffPaths, ...files]
    gitRemote.commits = [...gitRemote.commits, `${sha}\n${commit}`]
}

const _getPushedTags_ = (): string[] => gitRemote.tags

const gitPush = (
    tag: string,
    { cwd, remote }: { cwd: string; remote: string },
) => {
    gitRemote.tags.push(tag)
}

// TODO: These two are definitely wrong. Just mucking around and iterating.
const gitDiffTree = () =>
    gitRemote.diffPaths.join('-----------------monodeploy-----------------\n')

const gitLog = () => gitRemote.commits.join('\n')

module.exports = {
    __esModule: true,
    ...actualModule,
    _reset_,
    _commitFiles_,
    _getPushedTags_,
    gitPush,
    gitDiffTree,
    gitLog,
}
