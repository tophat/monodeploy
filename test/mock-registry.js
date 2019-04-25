let registry = {}

const publish = (name, version) => {
    registry[name] = version
}

const view = name => registry[name]

const reset = () => {
    registry = {}
}

export default {
    publish,
    view,
    reset
}
