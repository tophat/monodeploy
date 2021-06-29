/**
 * Layout component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.com/docs/use-static-query/
 */

import { graphql, useStaticQuery } from 'gatsby'
import * as React from 'react'

import Header from './header'
import './layout.css'

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const data = useStaticQuery(graphql`
        query SiteTitleQuery {
            site {
                siteMetadata {
                    title
                }
            }
        }
    `)

    return (
        <>
            <Header siteTitle={data.site.siteMetadata?.title || `Title`} />
            <div
                style={{
                    margin: `0 auto`,
                    maxWidth: 960,
                    padding: `0 1.0875rem 1.45rem`,
                }}
            >
                <main>{children}</main>
                <footer
                    style={{
                        marginTop: `2rem`,
                    }}
                >
                    <a
                        href="https://opensource.tophat.com/"
                        rel="noreferrer"
                        target="_blank"
                    >
                        Top Hat Open Source
                    </a>{' '}
                    © {new Date().getFullYear()}
                </footer>
            </div>
        </>
    )
}

export default Layout
