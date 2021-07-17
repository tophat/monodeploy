/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'

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
            obj[data.declaration?.indexSignature.parameters[0].name] =
                stringifyType(
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
    return data?.shortText ?? ''
}

const InterfaceChildRow: React.FC<{ data: any }> = ({ data }) => {
    if (data?.type?.type === 'reflection') {
        return data.type.declaration.children.map((child) => (
            <InterfaceChildRow
                data={{ ...child, name: `${data.name}.${child.name}` }}
            />
        ))
    }

    return (
        <tr>
            <td>{data.name}</td>
            <td>
                <code>{stringifyType(data.type)}</code>
            </td>
            <td>
                {data.comment
                    ? stringifyComment(data.comment)
                    : 'No description.'}
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
                <th>Name</th>
                <th>Type</th>
                <th>Description</th>
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
