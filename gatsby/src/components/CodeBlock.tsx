import Highlight, { type Language, defaultProps } from 'prism-react-renderer'
import theme from 'prism-react-renderer/themes/vsDark'
import React from 'react'

const CodeBlock: React.FC<React.HTMLAttributes<HTMLElement>> = ({ children, className }) => {
    const language = (className?.replace(/language-/, '') as Language | undefined) ?? undefined

    return language ? (
        <Highlight
            {...defaultProps}
            theme={theme}
            code={String(children).trim()}
            language={language}
        >
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
    ) : (
        <span
            style={{
                fontFamily: 'monospace',
                color: 'rgb(156, 220, 254)',
                background: 'rgb(30, 30, 30)',
            }}
        >
            {String(children)}
        </span>
    )
}

export default CodeBlock
