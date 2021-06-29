import * as React from 'react'

import Code from '../components/Code'
import Layout from '../components/layout'
import Seo from '../components/seo'

const GettingStartedPage: React.FC = () => (
    <Layout>
        <Seo title="Getting Started" />
        <h2>Getting Started</h2>
        <p>
            Install <code>monodeploy</code>:
        </p>
        <Code
            language="sh"
            code={`
                yarn add -D monodeploy
                yarn monodeploy --dry-run
            `}
        />
        <p>Edit your project's root package.json.</p>
        <ol>
            <li>
                Set <code>"private": true</code>
            </li>
            <li>
                Set <code>"workspaces": ["packages/*"]</code> (you can use a
                different glob to match your monorepo layout)
            </li>
            <li>
                Create a <code>monodeploy.config.js</code> file and set it to:
                <Code language="js" code="module.exports = {}" />
                You'll be extending this file as you make changes to your
                project's publish configuration.
            </li>
        </ol>
    </Layout>
)

export default GettingStartedPage
