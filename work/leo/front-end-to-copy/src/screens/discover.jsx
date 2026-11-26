import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DIMENSIONS } from '../config.js'
import { pickAvatar } from '../lib/avatar.js'
import { compare, roleOf, rolePath, similarity, topTags } from '../lib/matching.js'
import { label } from '../lib/tags.js'
import { useStore } from '../store.jsx'
import Icon from '../components/icons.jsx'
import { Button, Chips, Figure, Header, Tags } from '../components/ui.jsx'

const avatarOf = (p) => pickAvatar(p.selfTags.length === 3 ? p.selfTags : topTags(p.weights), [p.id])
const hue = (id) => [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 0)

export function People() {
  const { ranked } = useStore()
  const [query, setQuery] = useState('')
  const [dimension, setDimension] = useState(null)
  const q = query.toLowerCase()
  const list = ranked(dimension)
    .filter((p) => [p.name, p.handle, p.group, roleOf(p.weights), ...topTags(p.weights).map(label)].join(' ').toLowerCase().includes(q))
    .slice(0, 20)
  return (
    <>
      <Header title="Pessoas" />
      <input value={query} placeholder="Nome, @tag, característica, função..." onChange={(e) => setQuery(e.target.value)} />
      <Chips options={[[null, 'Tudo'], ...DIMENSIONS.map((d) => [d.id, d.label])]} value={dimension} onChange={setDimension} />
      <div className="two">
        {list.map((p) => (
          <Link key={p.id} to={`/people/${encodeURIComponent(p.id)}`} className="panel center">
            <Figure avatar={avatarOf(p)} size="sm" />
            <b>{p.name.split(' ').slice(0, 2).join(' ')}</b>
            <small>{p.handle}</small>
            <span className="match">{p.match}%</span>
            <Tags ids={topTags(p.weights)} />
          </Link>
        ))}
      </div>
      {!list.length && <p>Ninguém encontrado.</p>}
    </>
  )
}

export function Person() {
  const { id } = useParams()
  const { everyone, mine } = useStore()
  const p = everyone.find((x) => x.id === id)
  if (!p) return <Header title="Comparar" />
  const { common, biggest } = compare(mine, p.weights)
  const first = p.name.split(' ')[0]
  return (
    <>
      <Header title="Comparar" />
      <Figure avatar={avatarOf(p)} size="md" />
      <h1>{p.name}</h1>
      <p>{p.handle} · {roleOf(p.weights)} · {p.group}</p>
      <h1 className="accent">{similarity(mine, p.weights)}% de semelhança</h1>
      {DIMENSIONS.map((d) => {
        const value = similarity(mine, p.weights, d.id)
        return (
          <div key={d.id}>
            <small>{d.label} {value}%</small>
            <div className="bar"><i style={{ width: `${value}%` }} /></div>
          </div>
        )
      })}
      <h3>Em comum</h3>
      {common.length ? <Tags ids={common} /> : <p>Ainda nada em comum.</p>}
      {biggest && (
        <>
          <h3>Maior diferença</h3>
          <p>{label(biggest.tag)}: mais forte em {biggest.theirs ? first : 'ti'}.</p>
        </>
      )}
      <Button to={`/send/${encodeURIComponent(p.id)}`} icon="send">Mandar MighT</Button>
      <Button to="/roles" icon="roles" alt>Funções ideais</Button>
    </>
  )
}

export function Network() {
  const { session, links, everyone, ranked } = useStore()
  const navigate = useNavigate()
  const [mode, setMode] = useState('connections')
  const connected = useMemo(() => {
    const ids = new Set()
    for (const l of links) {
      if (l.from === session.meId) ids.add(l.to)
      if (l.to === session.meId) ids.add(l.from)
    }
    return ids
  }, [links, session.meId])

  const list = mode === 'similar' ? ranked().slice(0, 14) : everyone.filter((p) => connected.has(p.id))
  const nodes = list.map((p, i) => {
    const angle = (i * 2 * Math.PI) / list.length - Math.PI / 2
    const radius = mode === 'similar' ? 150 - p.match : 112 + (i % 2) * 32
    return { ...p, x: 180 + radius * Math.cos(angle), y: 180 + radius * Math.sin(angle) }
  })
  const between = nodes.flatMap((a) =>
    nodes.filter((b) => a.id < b.id && links.some((l) => (l.from === a.id && l.to === b.id) || (l.from === b.id && l.to === a.id))).map((b) => [a, b]),
  )
  return (
    <>
      <Header title="Rede" />
      <Chips options={[['connections', 'As tuas conexões'], ['similar', 'Parecidas contigo']]} value={mode} onChange={setMode} />
      <svg className="graph" viewBox="0 0 360 374">
        {between.map(([a, b]) => <line key={a.id + b.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="faint" />)}
        {nodes.map((n) => <line key={n.id} x1="180" y1="180" x2={n.x} y2={n.y} />)}
        {nodes.map((n) => (
          <g key={n.id} onClick={() => navigate(`/people/${encodeURIComponent(n.id)}`)}>
            <circle cx={n.x} cy={n.y} r={mode === 'similar' ? 9 + n.match / 6 : 13} fill={`hsl(${hue(n.id)} 60% 58%)`} />
            <text x={n.x} y={n.y + 30}>{n.name.split(' ')[0]}</text>
          </g>
        ))}
        <circle cx="180" cy="180" r="24" className="self" />
        <text x="180" y="220">Tu</text>
      </svg>
      {list.length ? (
        <p>Toca numa pessoa para comparar.</p>
      ) : (
        <>
          <p>Ainda não tens conexões.</p>
          <Button to="/send" icon="send">Mandar um MighT</Button>
        </>
      )}
      <Button to="/share" icon="qr" alt>Ligar por QR code</Button>
    </>
  )
}

export function Roles() {
  const { session, mine, ranked } = useStore()
  const account = Object.values(session.accounts).find((a) => a.role)
  const path = rolePath(mine, ranked(), account?.role || session.cv?.role)
  return (
    <>
      <Header title="Funções ideais" />
      {path.map((s, i) => (
        <div key={s.step} className="quest" style={{ marginLeft: i * 14 }}>
          <div className="panel">
            <small>{s.step} · hipótese</small>
            <h2>{s.role}</h2>
            <p><Icon name="sparkle" /> Porque isto encaixa em ti: {s.why}</p>
          </div>
        </div>
      ))}
      {!path.length && <p>Cria primeiro o teu MighT.</p>}
      <p>São hipóteses para explorar, não uma avaliação.</p>
      <Button to="/people" icon="search">Ver pessoas como tu</Button>
      <Button to="/home" icon="home" alt>Voltar ao início</Button>
    </>
  )
}
