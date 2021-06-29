import React from 'react'

const Code: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <code
            style={{
                padding: '1rem 0.5rem',
                display: 'block',
                margin: '0.5rem 0 0.5rem 0',
            }}
        >
            {children}
        </code>
    )
}

export default Code
