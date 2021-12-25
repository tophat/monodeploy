/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import ReactMarkdown from 'react-markdown'
import RemarkExternalLinks from 'remark-external-links'

const stringifyType = (data: any): string => {
    if (data.type === 'literal') {
        return data.value
    }

    if (data.type === 'union') {
        return data.types.map((t) => stringifyType(t)).join(' | ')
    }

    if (data.type === 'array') {
        return `${stringifyType(data.elementType)}[]`
    }

    if (data.type === 'reflection') {
        const obj = {}
        for (const child of data.declaration?.children ?? []) {
            obj[child.name] = stringifyType(child.type)
        }
        if (data.declaration?.indexSignature) {
            obj[data.declaration?.indexSignature.parameters[0].name] = stringifyType(
                data.declaration?.indexSignature.parameters[0].type,
            )
        }
        return JSON.stringify(obj, null, 2)
            .replace(/"([^"]+)":/g, '$1:')
            .replace(/: "([^"]+)"/g, ': $1')
    }

    if (data.name) {
        return data.name
    }

    return '???'
}

const stringifyComment = (data: any): string => {
    const defaultValue = data?.tags?.find((tag) => tag.tag === 'default')?.text
    const body = `${data?.shortText ?? ''}\n\n${data?.text ?? ''}`.trim()
    return `Default: ${defaultValue?.trim() ?? '_No Default_'}\n\n${body}`
}

const InterfaceChildRow: React.FC<{ data: any }> = ({ data }) => {
    if (data?.type?.type === 'reflection') {
        return data.type.declaration.children.map((child) => (
            <InterfaceChildRow data={{ ...child, name: `${data.name}.${child.name}` }} />
        ))
    }

    const rowId = `schema-option-${data.name}`

    return (
        <tr id={rowId}>
            <td>
                <a href={`#${rowId}`} className="name">
                    {data.name}
                </a>
                <div className="type">{stringifyType(data.type)}</div>
            </td>
            <td>
                <div className="description">
                    <ReactMarkdown plugins={[RemarkExternalLinks]}>
                        {data.comment ? stringifyComment(data.comment) : 'No description.'}
                    </ReactMarkdown>
                </div>
            </td>
        </tr>
    )
}

const TypeDocInterface: React.FC<{ schema: any; interfaceName: string }> = ({
    schema,
    interfaceName,
}) => {
    const interfaceData = schema.children.find((n) => n.name === interfaceName)

    return (
        <table className="typedoc-schema">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
                {interfaceData?.children?.map((data) => (
                    <InterfaceChildRow data={data} />
                ))}
            </tbody>
        </table>
    )
}

export default TypeDocInterface
