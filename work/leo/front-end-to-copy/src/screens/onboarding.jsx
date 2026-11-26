import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { api } from '../api/index.js'
import { PROVIDERS } from '../config.js'
import { handleOf } from '../lib/handle.js'
import { useStore } from '../store.jsx'
import Icon from '../components/icons.jsx'
import { Button, Figure, Header, Tags, TagPicker, picked } from '../components/ui.jsx'

export function Welcome() {
  const { session } = useStore()
  if (session.meId) return <Navigate to="/home" replace />
  return (
    <>
      <img className="logo" src="logo-white.svg" alt="MighT" />
      <Figure avatar={{ art: 'a9' }} />
      <h1>Descobre o que os outros veem em ti</h1>
      <p>Visualiza o teu potencial e descobre novas funções e carreiras, com base em dados.</p>
      <Button to="/cv" icon="profile">Entrar com LinkedIn</Button>
      <Button to="/cv" alt>Entrar com Google</Button>
      <Button to="/cv" alt>Entrar manualmente</Button>
      <small className="center">Entrada simulada. Nada fica público sem o teu consentimento.</small>
    </>
  )
}

export function Cv() {
  const { session, update } = useStore()
  const read = async (file) => file && update({ cv: await api.parseCv(file) })
  return (
    <>
      <Header title="1 de 3" />
      <h1>Carrega o teu CV</h1>
      <p>Usamos o CV para escolher a tua figura e sugerir funções. É opcional.</p>
      <label className="panel drop">
        <Icon name="upload" size={40} />
        <b>{session.cv?.fileName || 'Escolher ficheiro'}</b>
        <input type="file" accept=".pdf,.doc,.docx,.txt" hidden onChange={(e) => read(e.target.files[0])} />
      </label>
      {session.cv && (
        <div className="panel">
          <small>Lido do CV (simulado)</small>
          <b>{session.cv.role}</b>
          <div className="chips">{session.cv.skills.map((s) => <span key={s} className="chip">{s}</span>)}</div>
        </div>
      )}
      <Button to="/words" icon="next">{session.cv ? 'Continuar' : 'Saltar'}</Button>
    </>
  )
}

export function Words() {
  const { session, update } = useStore()
  const navigate = useNavigate()
  return (
    <>
      <Header title="2 de 3" />
      <h1>Escolhe 3 palavras</h1>
      <Figure
        size="sm"
        avatar={{
          head: session.selfTags.personality && { color: '#e88f3d' },
          body: session.selfTags.power && { color: '#358ec0' },
          arms: session.selfTags.character && { color: '#c87bce' },
        }}
      />
      <TagPicker value={session.selfTags} onChange={(selfTags) => update({ selfTags })} />
      <Button disabled={picked(session.selfTags).length < 3} onClick={() => navigate('/connect')}>Continuar</Button>
    </>
  )
}

export function Connections() {
  const { session, update } = useStore()
  const toggle = async (id) => {
    const accounts = { ...session.accounts }
    if (accounts[id]) delete accounts[id]
    else accounts[id] = await api.connectAccount(id)
    update({ accounts })
  }
  return (
    <>
      <h2>Contas ligadas</h2>
      <p>Junta provas ao teu MighT. Só guardamos o resumo que vês aqui, nunca a tua palavra-passe, e podes desligar quando quiseres.</p>
      {PROVIDERS.map((p) => {
        const account = session.accounts[p.id]
        return (
          <div key={p.id} className="panel account">
            <span className="logo-box" style={{ background: p.color }}>{p.badge}</span>
            <div>
              <b>{account?.title || p.name}</b>
              <small>{account ? account.lines.join(' · ') : p.text}</small>
            </div>
            <button className={account ? 'pill off' : 'pill'} onClick={() => toggle(p.id)}>{account ? 'Desligar' : 'Ligar'}</button>
          </div>
        )
      })}
      <small>Ligação simulada.</small>
    </>
  )
}

export function Connect() {
  const { session, update } = useStore()
  const navigate = useNavigate()
  return (
    <>
      <Header title="3 de 3" />
      <label>O teu nome
        <input value={session.name} placeholder="Nome e apelido" onChange={(e) => update({ name: e.target.value })} />
      </label>
      {session.name.trim() && <p className="hint">O teu @: <b>{handleOf(session.name)}</b></p>}
      <Connections />
      <Button icon="sparkle" disabled={!session.name.trim()} onClick={() => navigate('/generating')}>Criar o meu MighT</Button>
    </>
  )
}

export function Generating() {
  const { session, update } = useStore()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const tags = picked(session.selfTags)
  const ready = tags.length === 3 && session.name.trim()

  useEffect(() => {
    if (!ready) return
    let live = true
    const signals = Object.values(session.accounts).flatMap((a) => a.skills)
    if (session.cv) signals.push('creator')
    const timer = setTimeout(async () => {
      try {
        const avatar = await api.avatar(tags, signals)
        if (!live) return
        const meId = session.meId || (await api.createPerson(session.name.trim(), tags))
        update({ avatar, meId })
        navigate('/mighty', { replace: true })
      } catch (e) {
        setError(String(e.message || e))
      }
    }, 300)
    return () => {
      live = false
      clearTimeout(timer)
    }
  }, [])

  if (!ready) return <Navigate to="/words" replace />
  return (
    <div className="center stack">
      <h1>A criar o teu MighT</h1>
      <div className="pulse"><Figure avatar={{ head: { color: '#c87bce' }, body: { color: '#358ec0' }, arms: { color: '#e88f3d' } }} /></div>
      <p>{error || 'A escolher a figura a partir das tuas palavras, CV e contas.'}</p>
      {error && <Button to="/connect">Voltar</Button>}
    </div>
  )
}

export function Mighty() {
  const { session, me } = useStore()
  const { avatar } = session
  if (!avatar) return <Navigate to="/" replace />
  return (
    <>
      <Header title="O teu MighT" />
      <h1 className="center">{session.name}</h1>
      <p className="center hint">{me?.handle}</p>
      <Figure avatar={avatar} />
      <Tags ids={picked(session.selfTags)} />
      <p className="quote">«{avatar.tagline}»</p>
      <div className="panel">
        <small>Porquê esta figura</small>
        <p>{avatar.reason?.length ? `Foi escolhida para ti por causa de ${avatar.reason.join(' e ')}.` : 'Foi escolhida para ti a partir das tuas 3 palavras.'}</p>
      </div>
      <p>E agora, não queres descobrir o que os outros veem em ti? Começa por dar.</p>
      <Button to="/send" icon="send">Mandar um MighT</Button>
      <Button to="/home" icon="home" alt>Ir para o início</Button>
    </>
  )
}
