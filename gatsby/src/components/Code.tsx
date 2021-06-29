import Prism from 'prismjs'
import React from 'react'
import 'prismjs/themes/prism-tomorrow.css'

const Code: React.FC<{
    code: string
    language: string
}> = ({ code, language }) => {
    const el = React.useRef<HTMLElement | null>(null)

    React.useEffect(() => {
        if (el) {
            Prism.highlightElement(el.current as Element)
        }
    }, [el])

    return (
        <code
            style={{
                padding: '1rem 0.5rem',
                display: 'block',
                whiteSpace: 'pre-line',
            }}
            className={`language-${language}`}
            ref={el}
        >
            {code.trim()}
        </code>
    )
}

export default Code
