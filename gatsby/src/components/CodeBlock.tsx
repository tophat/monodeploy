import Highlight, { defaultProps } from 'prism-react-renderer'
import theme from 'prism-react-renderer/themes/vsDark'
import React from 'react'

const CodeBlock: React.FC<{
    children: React.ReactNode
    className: string
}> = ({ children, className }) => {
    const language = className.replace(/language-/, '')

    return (
        <Highlight {...defaultProps} theme={theme} code={children.trim()} language={language}>
            {({ className, style, tokens, getLineProps, getTokenProps }) => (
                <pre className={className} style={{ ...style, padding: '20px' }}>
                    {tokens.map((line, i) => (
                        <div key={i} {...getLineProps({ line, key: i })}>
                            {line.map((token, key) => (
                                <span key={key} {...getTokenProps({ token, key })} />
                            ))}
                        </div>
                    ))}
                </pre>
            )}
        </Highlight>
    )
}

export default CodeBlock
