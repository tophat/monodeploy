import { Configuration, Project, Report, Workspace } from '@yarnpkg/core'
import { AsyncSeriesHook } from 'tapable'

export type RecursivePartial<T> = {
    [P in keyof T]?: T[P] extends Record<string, unknown> ? RecursivePartial<T[P]> : T[P]
}

export interface MonodeployConfiguration {
    /**
     * Default: cwd
     *
     * The working directory to run all operations from. Defaults to the
     * current working directory.
     */
    cwd: string

    /**
     * Default: [Yarn Configuration](https://yarnpkg.com/configuration/yarnrc)
     *
     * The NPM registry URL for fetching package information, and publishing
     * packages outside of dry run. Note that this overrides any
     * publishConfig.registryUrl or Yarn RC configuration.
     */
    registryUrl?: string

    /**
     * Default: false
     *
     * By default the latest package versions upon which the version strategy
     * is applied, is taken from the NPM registry. If noRegistry mode is enabled,
     * the latest version is instead taken from the package.json files. This is
     * incompatible with prerelease mode.
     */
    noRegistry: boolean

    /**
     * Default: false
     *
     * If enabled, any operation performing a destructive action on an external
     * system is skipped over. This includes publishing to NPM, committing to git,
     * and execution of lifecycle scripts. Use dry run to preview publish changes,
     * and to validate your configuration.
     */
    dryRun: boolean

    git: {
        /**
         * Default: _last tagged commit_
         *
         * The base git ref to using as the starting point of package change
         * discovery. If not set, this will default to the last tagged commit.
         * You usually do not want to set this.
         */
        baseBranch: string

        /**
         * Default: HEAD
         *
         * The git ref which marks the "end point" of package change discovery.
         * This defaults to HEAD. You usually do not want to set this.
         */
        commitSha: string

        /**
         * Default: origin
         *
         * The git remote name to push tags and the release commit to. Defaults
         * to origin.
         */
        remote: string

        /**
         * Default: false
         *
         * Whether to push to the git remote. This works in conjunction with the
         * git.tag and autoCommit options, thus allowing you to create the tags
         * and release commit automatically while deferring the actual push.
         */
        push: boolean

        /**
         * Default: true
         *
         * Whether to create git tags to track the releases. It is useful to disable this
         * when publishing to a test registry, where you do not want to modify the main git branch.
         */
        tag: boolean
    }

    /**
     * Default: _Partial internal implementation (not recommended)_
     *
     * A conventional changelog config package name. This is required for changelog generation.
     * This config determines the changelog format, as well as the version strategy determiner.
     */
    conventionalChangelogConfig?:
        | string
        | {
              name: string
              [key: string]: unknown
          }

    /**
     * Default: _No Default_
     *
     * The filename to write the changeset to. This is a metadata file which after a monodeploy
     * run, will contain change history useful for external scripts. Set to '-' to write to stdout.
     */
    changesetFilename?: string

    /**
     * Default: _No Default_
     *
     * The filename to write changelogs to, assuming a conventional changelog config has been set.
     * Use '<packageDir>' to reference the cwd of an individual workspace.
     */
    changelogFilename?: string

    /**
     * Default: []
     *
     * An array of micromatch globs which will be used to filter out modified files. You can
     * use this to skip modifications to 'test files' as part of the 'how this package changed'
     * determination.
     */
    changesetIgnorePatterns?: Array<string>

    /**
     * Default: false
     *
     * By default, the changeset and changelog files are not written in dry run mode, as
     * they constitute a change to an external system. Enable force write to write these
     * change files, which can be useful for generating publish previews.
     */
    forceWriteChangeFiles: boolean

    /**
     * Default: infer
     *
     * This overrides the access defined in the publishConfig of individual
     * workspaces. Set this to 'infer' to respect individual workspace configurations.
     */
    access?: 'infer' | 'public' | 'restricted'

    /**
     * Default: false
     *
     * Whether to persist package.json modifications, i.e. updating the dependency versions
     * and the version field of each published workspace. Most publishing tools act as if this
     * is enabled. It can be useful to disable version persistence if you do not want your CI
     * environment to write back to your Git repository. Useful for runners like Jenkins.
     */
    persistVersions: boolean

    /**
     * Default: false
     *
     * Whether to automatically create a release commit, for use with persistVersions.
     */
    autoCommit: boolean

    /**
     * Default: "chore: release [skip ci]"
     *
     * The commit message to use when autoCommit is enabled.
     */
    autoCommitMessage: string

    /**
     * Default: []
     *
     * An array of regular expressions which will be used to filter out commits from the
     * explicit package bump detection. The patterns are matched against commits of the form:
     * <sha> <newline> <body>
     */
    commitIgnorePatterns?: Array<string | RegExp>

    /**
     * The manifest field name to use in workspace grouping. All packages
     * within a group will always have the same version. If unset, all packages
     * are versioned independently.
     */
    packageGroupManifestField?: string

    /**
     * Default: false
     *
     * Whether to run the lifecycle scripts of the packages to publish in topological order,
     * based on dependencies and peerDependencies. This excludes devDependencies from the graph.
     */
    topological: boolean

    /**
     * Default: false
     *
     * Similar to topological, however also consider devDependencies.
     */
    topologicalDev: boolean

    /**
     * Default: 0 _(No Limit)_
     *
     * The maximum number of packages whose lifecycle scripts can be run in parallel. Similar to
     * concurrency in Lerna.
     */
    jobs: number

    /**
     * Default: 0 _(Internal Implementation Detail)_
     *
     * The maximum number of package metadata to read from the NPM registry simultaneously.
     * If no default is set, or set to 0, Monodeploy will use its discretion.
     */
    maxConcurrentReads: number

    /**
     * Default: 0 _(Internal Implementation Detail)_
     *
     * The maximum number of packages to publish to the NPM registry simultaneously. We have seen
     * issues in the past with too many concurrent writes for private registries.
     * If no default is set, or set to 0, Monodeploy will use its discretion.
     */
    maxConcurrentWrites: number

    /**
     * Default: []
     *
     * An array of Monodeploy plugins. See the plugin section of the documentation for more
     * information.
     */
    plugins?: Array<string>

    /**
     * Default: false
     *
     * Whether to run Monodeploy in Prerelease mode. In prerelease mode, versions are not
     * published to the latest npm dist tag. This is meant for release candidates, and beta
     * versions. Version strategy behaviour is also impacted by this mode.
     */
    prerelease: boolean

    /**
     * Default: "rc"
     *
     * The identifier to use in the prerelease tag. Defaults to 'rc' as in '1.0.0-rc.1'.
     */
    prereleaseId: string

    /**
     * Default: "next"
     *
     * The npm dist-tag to publish to in prerelease mode. Defaults to 'next'.
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
    { type: PackageStrategyType; group?: string | null; commits: CommitMessage[] }
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
