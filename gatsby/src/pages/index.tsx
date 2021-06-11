import * as React from 'react'

import Layout from '../components/layout'
import Seo from '../components/seo'

const IndexPage: React.FC = () => (
    <Layout>
        <Seo title="Home" />
        <h1>Welcome!</h1>
        <p>
            Please check back soon. While we work on this website, checkout the
            README on{' '}
            <a href="https://github.com/tophat/monodeploy">
                https://github.com/tophat/monodeploy
            </a>
            .
        </p>
    </Layout>
)

export default IndexPage
