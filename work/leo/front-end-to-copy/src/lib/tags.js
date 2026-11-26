import list from '../data/tags.json'

export const TAGS = list
const byId = Object.fromEntries(list.map((t) => [t.id, t]))

export const tag = (id) => byId[id]
export const label = (id) => byId[id]?.pt ?? id
export const tagsOf = (dimension) => list.filter((t) => t.dimension === dimension)
