export function handleOf(name) {
  const parts = name.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
  const short = parts.length > 1 ? [parts[0], parts.at(-1)] : parts
  return `@${short.join('_') || 'might'}`
}

export function withHandles(people) {
  const used = {}
  return people.map((p) => {
    const base = p.handle || handleOf(p.name)
    used[base] = (used[base] || 0) + 1
    return { ...p, handle: used[base] > 1 ? `${base}${used[base]}` : base }
  })
}
