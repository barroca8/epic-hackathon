import roles from '../data/roles.json'
import { DIMENSIONS } from '../config.js'
import { tag, label } from './tags.js'

const roleByTag = Object.fromEntries(roles.map((r) => [r.tag, r]))

// weight = count / total in that dimension
export function weights(tagLists) {
  const out = { personality: {}, power: {}, character: {} }
  for (const t of tagLists.flat()) {
    const d = tag(t)?.dimension
    if (d) out[d][t] = (out[d][t] || 0) + 1
  }
  for (const d in out) {
    const total = Object.values(out[d]).reduce((a, b) => a + b, 0)
    out[d] = Object.fromEntries(
      Object.entries(out[d]).sort((a, b) => b[1] - a[1]).map(([t, n]) => [t, n / total]),
    )
  }
  return out
}

export const topTag = (w, dimension) => Object.keys(w?.[dimension] || {})[0]
export const topTags = (w) => DIMENSIONS.map((d) => topTag(w, d.id)).filter(Boolean)

// similarity = % of overlapping weight, averaged over the chosen dimensions
export function similarity(a, b, dimension = null) {
  const dims = dimension ? [dimension] : DIMENSIONS.map((d) => d.id)
  const total = dims.reduce(
    (sum, d) => sum + Object.entries(a[d]).reduce((s, [t, v]) => s + Math.min(v, b[d][t] || 0), 0),
    0,
  )
  return Math.round((100 * total) / dims.length)
}

export function compare(a, b) {
  const all = DIMENSIONS.flatMap((d) => Object.keys({ ...a[d.id], ...b[d.id] }))
  const delta = (t) => (b[tag(t).dimension][t] || 0) - (a[tag(t).dimension][t] || 0)
  const common = all.filter((t) => a[tag(t).dimension][t] && b[tag(t).dimension][t])
  const biggest = [...all].sort((x, y) => Math.abs(delta(y)) - Math.abs(delta(x)))[0]
  return { common, biggest: biggest && { tag: biggest, theirs: delta(biggest) > 0 } }
}

export const roleOf = (w) => roleByTag[topTag(w, 'power')]?.now ?? 'A explorar'

export function rolePath(mine, ranked, currentRole) {
  const score = {}
  for (const [t, v] of Object.entries(mine.power)) score[t] = v * 3
  const near = ranked.slice(0, 12)
  for (const p of near) {
    const t = topTag(p.weights, 'power')
    if (t) score[t] = (score[t] || 0) + p.match / 200
  }
  const [first, second = first] = Object.keys(score)
    .filter((t) => roleByTag[t])
    .sort((a, b) => score[b] - score[a])
  if (!first) return []
  const why = (t) => {
    const names = near.filter((p) => topTag(p.weights, 'power') === t).slice(0, 2).map((p) => p.name.split(' ')[0])
    const others = names.length ? ` e ${names.join(' e ')}, com um perfil parecido, também` : ''
    return `«${label(t)}» faz parte do teu perfil${others}.`
  }
  return [
    { step: 'Agora', role: currentRole || roleByTag[first].now, why: currentRole ? 'Vem das contas ou do CV que ligaste.' : why(first) },
    { step: 'Próximo', role: roleByTag[first].next, why: why(first) },
    { step: 'Desafio', role: roleByTag[second].next, why: why(second) },
  ]
}
