import { graphql } from 'gatsby'
import React from 'react'

import Layout from '../components/layout'
import Seo from '../components/seo'

interface MarkdownRemark {
    html: string
    frontmatter: {
        slug: string
        title: string
    }
}

const Template: React.FC<{ data: { markdownRemark: MarkdownRemark } }> = ({
    data, // this prop will be injected by the GraphQL query below.
}) => {
    const { markdownRemark } = data // data.markdownRemark holds your post data
    const { html } = markdownRemark
    return (
        <Layout>
            <Seo title={markdownRemark.frontmatter.title} />
            <div
                className="md-content"
                dangerouslySetInnerHTML={{ __html: html }}
            />
        </Layout>
    )
}

export default Template

export const pageQuery = graphql`
    query ($id: String!) {
        markdownRemark(id: { eq: $id }) {
            html
            frontmatter {
                slug
                title
            }
        }
    }
`
