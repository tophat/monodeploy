import { Configuration, Project, Report, Workspace } from '@yarnpkg/core'
import { AsyncSeriesHook } from 'tapable'

export type RecursivePartial<T> = {
    [P in keyof T]?: T[P] extends Record<string, unknown> ? RecursivePartial<T[P]> : T[P]
}

export interface MonodeployConfiguration {
    /**
     * The working directory to run all operations from. Defaults to the
     * current working directory.
     *
     * @default cwd
     */
    cwd: string

    /**
     * The NPM registry URL for fetching package information, and publishing
     * packages outside of dry run. Note that this overrides any
     * publishConfig.registryUrl or Yarn RC configuration.
     *
     * @default [Yarn Configuration](https://yarnpkg.com/configuration/yarnrc)
     */
    registryUrl?: string

    /**
     * By default the latest package versions upon which the version strategy
     * is applied, is taken from the NPM registry. If noRegistry mode is enabled,
     * the latest version is instead taken from the package.json files. This is
     * incompatible with prerelease mode.
     *
     * @default false
     */
    noRegistry: boolean

    /**
     * If enabled, any operation performing a destructive action on an external
     * system is skipped over. This includes publishing to NPM, committing to git,
     * and execution of lifecycle scripts. Use dry run to preview publish changes,
     * and to validate your configuration.
     *
     * @default false
     */
    dryRun: boolean

    git: {
        /**
         * The base git ref to using as the starting point of package change
         * discovery. If not set, this will default to the last tagged commit.
         * You usually do not want to set this.
         *
         * @default _last tagged commit_
         */
        baseBranch: string

        /**
         * The git ref which marks the "end point" of package change discovery.
         * This defaults to HEAD. You usually do not want to set this.
         *
         * @default HEAD
         */
        commitSha: string

        /**
         * The git remote name to push tags and the release commit to. Defaults
         * to origin.
         *
         * @default origin
         */
        remote: string

        /**
         * Whether to push to the git remote. This works in conjunction with the
         * git.tag and autoCommit options, thus allowing you to create the tags
         * and release commit automatically while deferring the actual push.
         *
         * @default false
         */
        push: boolean

        /**
         * Whether to create git tags to track the releases. It is useful to disable this
         * when publishing to a test registry, where you do not want to modify the main git branch.
         *
         * @default true
         */
        tag: boolean
    }

    /**
     * A conventional changelog config package name. This is required for changelog generation.
     * This config determines the changelog format, as well as the version strategy determiner.
     *
     * @default _Partial internal implementation (not recommended)_
     */
    conventionalChangelogConfig?:
        | string
        | {
              name: string
              [key: string]: unknown
          }

    /**
     * The filename to write the changeset to. This is a metadata file which after a monodeploy
     * run, will contain change history useful for external scripts. Set to '-' to write to stdout.
     */
    changesetFilename?: string

    /**
     * The filename to write changelogs to, assuming a conventional changelog config has been set.
     * Use '<packageDir>' to reference the cwd of an individual workspace.
     */
    changelogFilename?: string

    /**
     * An array of micromatch globs which will be used to filter out modified files. You can
     * use this to skip modifications to 'test files' as part of the 'how this package changed'
     * determination.
     *
     * @default []
     */
    changesetIgnorePatterns?: Array<string>

    /**
     * By default, the changeset and changelog files are not written in dry run mode, as
     * they constitute a change to an external system. Enable force write to write these
     * change files, which can be useful for generating publish previews.
     *
     * @default false
     */
    forceWriteChangeFiles: boolean

    /**
     * This overrides the access defined in the publishConfig of individual
     * workspaces. Set this to 'infer' to respect individual workspace configurations.
     *
     * @default infer
     */
    access?: 'infer' | 'public' | 'restricted'

    /**
     * Whether to persist package.json modifications, i.e. updating the dependency versions
     * and the version field of each published workspace. Most publishing tools act as if this
     * is enabled. It can be useful to disable version persistence if you do not want your CI
     * environment to write back to your Git repository. Useful for runners like Jenkins.
     *
     * @default false
     */
    persistVersions: boolean

    /**
     * Whether to automatically create a release commit, for use with persistVersions.
     *
     * @default false
     */
    autoCommit: boolean

    /**
     * The commit message to use when autoCommit is enabled.
     *
     * @default "chore: release [skip ci]"
     */
    autoCommitMessage: string

    /**
     * An array of regular expressions which will be used to filter out commits from the
     * explicit package bump detection. The patterns are matched against commits of the form:
     * <sha> <newline> <body>
     *
     * @default []
     */
    commitIgnorePatterns?: Array<string | RegExp>

    /**
     * The manifest field name to use in workspace grouping. All packages
     * within a group will always have the same version and git tag. If unset, all packages
     * are versioned independently. Since the group is used for the git tag, it must not contain
     * any characters not supported in a git tag.
     *
     * You can use a '.' to access nested properties in the manifest file. For example,
     * you can use 'publishConfig.group' to access the group property in your publishConfig.
     */
    packageGroupManifestField?: string

    /**
     * Whether to run the lifecycle scripts of the packages to publish in topological order,
     * based on dependencies and peerDependencies. This excludes devDependencies from the graph.
     *
     * @default false
     */
    topological: boolean

    /**
     * Similar to topological, however also consider devDependencies.
     *
     * @default false
     */
    topologicalDev: boolean

    /**
     * The maximum number of packages whose lifecycle scripts can be run in parallel. Similar to
     * concurrency in Lerna.
     *
     * @default 0 _(No Limit)_
     */
    jobs: number

    /**
     * The maximum number of package metadata to read from the NPM registry simultaneously.
     * If no default is set, or set to 0, Monodeploy will use its discretion.
     *
     * @default 0 _(Internal Implementation Detail)_
     */
    maxConcurrentReads: number

    /**
     * The maximum number of packages to publish to the NPM registry simultaneously. We have seen
     * issues in the past with too many concurrent writes for private registries.
     * If no default is set, or set to 0, Monodeploy will use its discretion.
     *
     * @default 0 _(Internal Implementation Detail)_
     */
    maxConcurrentWrites: number

    /**
     * An array of Monodeploy plugins. See the plugin section of the documentation for more
     * information.
     *
     * @default []
     */
    plugins?: Array<string>

    /**
     * Whether to run Monodeploy in Prerelease mode. In prerelease mode, versions are not
     * published to the latest npm dist tag. This is meant for release candidates, and beta
     * versions. Version strategy behaviour is also impacted by this mode.
     *
     * @default false
     */
    prerelease: boolean

    /**
     * The identifier to use in the prerelease tag. Defaults to 'rc' as in '1.0.0-rc.1'.
     *
     * @default "rc"
     */
    prereleaseId: string

    /**
     * The npm dist-tag to publish to in prerelease mode. Defaults to 'next'.
     *
     * @default "next"
     */
    prereleaseNPMTag: string
}

export interface YarnContext {
    configuration: Configuration
    project: Project
    workspace: Workspace
    report: Report
    hooks?: PluginHooks
}

export interface PluginHooks {
    onReleaseAvailable: AsyncSeriesHook<
        [Readonly<YarnContext>, Readonly<MonodeployConfiguration>, Readonly<ChangesetSchema>],
        void
    >
}

export type CommitMessage = {
    sha: string
    body: string
}

export type PackageTagMap = Map<string, Record<string, string | undefined> & { latest: string }>

export type PackageVersionMap = Map<string, string>

export type PackageStrategyType = 'major' | 'minor' | 'patch'

export type PackageStrategyMap = Map<
    string,
    { type: PackageStrategyType; commits: CommitMessage[] }
>

export type StrategyDeterminer = (commits: string[]) => Promise<number>

export interface ChangesetRecord {
    version: string
    previousVersion?: string | null
    changelog: string | null
    tag: string | null
    strategy?: PackageStrategyType | null
    group: string
}

export interface ChangesetSchema {
    [packageName: string]: ChangesetRecord
}

export function isNodeError<T = NodeJS.ErrnoException>(error: unknown): error is T {
    return error instanceof Error || (error as any)?.code !== undefined
}
