import { graphql, useStaticQuery } from 'gatsby'
import Prism from 'prismjs'
import * as React from 'react'

import Header from './header'
import 'sanitize.css'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-bash'
import 'prismjs/themes/prism-tomorrow.css'
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

    React.useEffect(() => {
        Prism.highlightAll()
    }, [])

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
                <hr />
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
