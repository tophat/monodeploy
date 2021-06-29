import { Link } from 'gatsby'
import * as React from 'react'

const Header: React.FC<{ siteTitle: string }> = ({ siteTitle = '' }) => (
    <header
        style={{
            background: `#803ed7`,
            marginBottom: `1.45rem`,
        }}
    >
        <div
            style={{
                margin: `0 auto`,
                maxWidth: 960,
                padding: `1.45rem 1.0875rem`,
            }}
        >
            <h1 style={{ margin: 0 }}>
                <Link
                    to="/"
                    style={{
                        color: `white`,
                        textDecoration: `none`,
                    }}
                >
                    {siteTitle}
                </Link>
            </h1>
            <a
                href="https://github.com/tophat/monodeploy"
                style={{ color: '#ffffff' }}
                rel="noreferrer"
            >
                View GitHub Project
            </a>
        </div>
    </header>
)

export default Header
