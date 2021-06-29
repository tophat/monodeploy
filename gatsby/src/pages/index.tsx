import * as React from 'react'

import Code from '../components/Code'
import Layout from '../components/layout'
import Seo from '../components/seo'

const IndexPage: React.FC = () => (
    <Layout>
        <Seo title="Home" />
        <h2>What is Monodeploy?</h2>
        <p>
            <a href="https://github.com/tophat/monodeploy/actions?query=workflow%3A%22Continuous+Integration%22">
                <img
                    src="https://github.com/tophat/monodeploy/workflows/Continuous%20Integration/badge.svg?branch=master"
                    alt="Continuous Integration"
                />
            </a>{' '}
            <a href="https://codecov.io/gh/tophat/monodeploy">
                <img
                    src="https://codecov.io/gh/tophat/monodeploy/branch/master/graph/badge.svg"
                    alt="codecov"
                />
            </a>{' '}
            <a href="https://github.com/tophat/getting-started/blob/master/scorecard.md">
                <img
                    src="https://img.shields.io/badge/Maturity-Level%202%20--%20First%20Release-yellowgreen.svg"
                    title="Maturity badge - level 2"
                />
            </a>{' '}
            <a href="https://github.com/tophat/monodeploy/blob/master/LICENSE">
                <img
                    src="https://img.shields.io/github/license/tophat/monodeploy"
                    alt="GitHub license"
                />
            </a>{' '}
            <a href="https://discord.gg/YhK3GFcZrk">
                <img
                    src="https://img.shields.io/discord/809577721751142410"
                    alt="Discord"
                />
            </a>{' '}
            <br />
            <a href="https://github.com/tophat/monodeploy">
                <img
                    src="https://img.shields.io/node/v/monodeploy"
                    alt="Node Version"
                />
            </a>{' '}
            <a href="https://www.npmjs.com/package/monodeploy">
                <img
                    src="https://img.shields.io/npm/v/monodeploy.svg"
                    alt="npm"
                />
            </a>{' '}
            <a href="https://npm-stat.com/charts.html?package=monodeploy">
                <img
                    src="https://img.shields.io/npm/dm/monodeploy.svg"
                    alt="npm downloads"
                />
            </a>
        </p>
        <p>
            Monodeploy is a powerful CLI tool which aims to simplify the package
            publishing process for monorepos. It leverages Yarn Berry workspaces
            to do the heavy lifting, and is a direct replacement for tools such
            as Lerna and Semantic Release.
        </p>
        <p>
            Monodeploy only supports projects using Yarn Berry with the minimum
            node version set to Node v14.0.0.
        </p>
        <h2>Getting Started</h2>
        <Code>yarn add -D monodeploy</Code>
        <p style={{ marginBottom: 0 }}>For help &amp; usage:</p>
        <Code>yarn monodeploy --help</Code>
    </Layout>
)

export default IndexPage
