import React from 'react'
import ReactMarkdown from 'react-markdown'
import RemarkExternalLinks from 'remark-external-links'
import type { Comment, DeclarationReflection, ProjectReflection, SomeType } from 'typedoc'

const stringifyType = (data: SomeType | undefined): string => {
    if (data?.type === 'literal') {
        return String(data.value)
    }

    if (data?.type === 'union') {
        return data.types.map((t) => stringifyType(t)).join(' | ')
    }

    if (data?.type === 'array') {
        return `${stringifyType(data.elementType)}[]`
    }

    if (data?.type === 'reflection') {
        const obj: Record<string, string> = {}
        for (const child of data.declaration?.children ?? []) {
            obj[child.name] = stringifyType(child.type)
        }
        if (data.declaration?.indexSignature?.parameters) {
            obj[data.declaration?.indexSignature.parameters[0].name] = stringifyType(
                data.declaration?.indexSignature.parameters[0].type,
            )
        }
        return JSON.stringify(obj, null, 2)
            .replace(/"([^"]+)":/g, '$1:')
            .replace(/: "([^"]+)"/g, ': $1')
    }

    if ((data as any)?.name) {
        return (data as any)?.name
    }

    return '???'
}

const stringifyComment = (
    data: Comment | undefined,
    tags: Partial<Record<`@${string}`, string>>,
): string => {
    const deprecation = tags['@deprecated']
    const defaultValue = tags['@default']
    const body = `${data?.summary[0].text ?? ''}`.trim()

    let text = `Default: ${defaultValue?.trim() ?? '_No Default_'}\n\n${body}`
    if (deprecation) {
        text += `\n\n---\n\nDeprecated: ${deprecation}`
    }

    return text
}

const InterfaceChildRow: React.FC<{ data: DeclarationReflection }> = ({ data }) => {
    const dataType = data.type
    if (dataType?.type === 'reflection' && dataType.declaration.children) {
        return (
            <>
                {dataType.declaration.children.map((child) => (
                    <InterfaceChildRow
                        data={
                            {
                                ...child,
                                name: `${data.name}.${child.name}`,
                            } as DeclarationReflection
                        }
                    />
                ))}
            </>
        )
    }

    const rowId = `schema-option-${data.name}`
    const tags = (data?.comment?.blockTags ?? []).reduce<Partial<Record<`@${string}`, string>>>(
        (tags, blockTag) => {
            tags[blockTag.tag] = blockTag.content[0].text
            return tags
        },
        {},
    )

    return (
        <tr
            id={rowId}
            className={`schema-option ${tags['@deprecated'] ? 'deprecated' : ''}`.trim()}
        >
            <td>
                <a
                    href={`#${rowId}`}
                    className={`name ${tags['@deprecated'] ? 'deprecated' : ''}`.trim()}
                >
                    {data.name}
                </a>
                <div className="type">{stringifyType(data.type)}</div>
            </td>
            <td>
                <div className="description">
                    <ReactMarkdown remarkPlugins={[RemarkExternalLinks]}>
                        {data.comment ? stringifyComment(data.comment, tags) : 'No description.'}
                    </ReactMarkdown>
                </div>
            </td>
        </tr>
    )
}

const TypeDocInterface: React.FC<{ schema: ProjectReflection; interfaceName: string }> = ({
    schema,
    interfaceName,
}) => {
    const interfaceData = schema.children?.find((n) => n.name === interfaceName)

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
