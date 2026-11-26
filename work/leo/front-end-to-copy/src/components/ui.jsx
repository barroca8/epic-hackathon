import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CIRCLES, DIMENSIONS } from '../config.js'
import { label, tag, tagsOf } from '../lib/tags.js'
import { figureSrc } from '../lib/figure.js'
import { useStore } from '../store.jsx'
import Icon from './icons.jsx'

export const Figure = ({ avatar, size = 'lg' }) => <img className={`fig ${size}`} src={figureSrc(avatar)} alt="Figura MighT" />

export function Header({ title }) {
  const navigate = useNavigate()
  const { profile } = useStore()
  const waiting = profile?.pending.length
  return (
    <header>
      <button className="ib" onClick={() => navigate(-1)} aria-label="Voltar"><Icon name="back" /></button>
      <b>{title}</b>
      {profile ? (
        <Link className="ib" to="/inbox" aria-label="Caixa">
          <Icon name="inbox" />
          {waiting > 0 && <span className="badge">{waiting}</span>}
        </Link>
      ) : <span className="ib" />}
    </header>
  )
}

export function Button({ to, icon, alt, children, ...props }) {
  const className = alt ? 'btn alt' : 'btn'
  const content = <>{icon && <Icon name={icon} />}{children}</>
  return to ? <Link className={className} to={to} {...props}>{content}</Link> : <button className={className} {...props}>{content}</button>
}

export const Chips = ({ options, value, onChange }) => (
  <div className="chips">
    {options.map(([id, text]) => (
      <button key={String(id)} className={value === id ? 'chip on' : 'chip'} onClick={() => onChange(id)}>{text}</button>
    ))}
  </div>
)

export const CircleChips = (props) => <Chips options={CIRCLES.map((c) => [c, c])} {...props} />

export const Tags = ({ ids, weights }) => (
  <div className="chips">
    {ids.filter(Boolean).map((id) => (
      <span key={id} className={`chip ${tag(id)?.dimension}`}>
        {label(id)}{weights && ` ${Math.round(100 * (weights[tag(id).dimension][id] || 0))}%`}
      </span>
    ))}
  </div>
)

export function TagPicker({ value, onChange }) {
  const [step, setStep] = useState(0)
  const dim = DIMENSIONS[step]
  const pick = (id) => {
    onChange({ ...value, [dim.id]: id })
    if (step < 2) setStep(step + 1)
  }
  return (
    <>
      <div className="tabs">
        {DIMENSIONS.map((d, i) => (
          <button key={d.id} className={i === step ? 'on' : ''} onClick={() => setStep(i)}>
            {d.label}<small>{value[d.id] ? label(value[d.id]) : d.hint}</small>
          </button>
        ))}
      </div>
      <p className="hint">{value[dim.id] ? tag(value[dim.id]).line : 'Toca numa palavra'}</p>
      <div className="chips">
        {tagsOf(dim.id).map((t) => (
          <button key={t.id} className={value[dim.id] === t.id ? 'chip on' : 'chip'} onClick={() => pick(t.id)}>{t.pt}</button>
        ))}
      </div>
    </>
  )
}

export const picked = (value) => DIMENSIONS.map((d) => value[d.id]).filter(Boolean)

export function PersonSelect({ value, onChange, placeholder }) {
  const { everyone, session } = useStore()
  const [text, setText] = useState(() => everyone.find((p) => p.id === value)?.handle || '')
  const others = everyone.filter((p) => p.id !== session.meId)
  const type = (next) => {
    setText(next)
    const q = next.trim().toLowerCase()
    onChange(others.find((p) => p.handle === q || p.name.toLowerCase() === q)?.id || '')
  }
  const q = text.toLowerCase()
  const matches = q.length > 1 && !value
    ? others.filter((p) => p.handle.includes(q) || p.name.toLowerCase().includes(q)).slice(0, 4)
    : []
  const chosen = others.find((p) => p.id === value)
  return (
    <>
      <input value={text} placeholder={placeholder} autoCapitalize="none" onChange={(e) => type(e.target.value)} />
      {matches.map((p) => (
        <button key={p.id} className="panel" onClick={() => type(p.handle)}>{p.handle}<small>{p.name} · {p.group}</small></button>
      ))}
      {chosen && <p className="hint"><Icon name="check" /> {chosen.name}</p>}
    </>
  )
}

export function Locked({ title, text }) {
  return (
    <div className="panel center">
      <Icon name="lock" size={44} />
      <h2>{title}</h2>
      <p>{text}</p>
      <Button to="/inbox" icon="inbox">Caixa de MighTs</Button>
      <Button to="/ask" icon="request" alt>Pedir MighTs</Button>
    </div>
  )
}
