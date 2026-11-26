import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import qrcode from 'qrcode-generator'
import { api } from '../api/index.js'
import { UNLOCK_AT } from '../config.js'
import { useStore } from '../store.jsx'
import { Button, CircleChips, Header, PersonSelect, Tags, TagPicker, picked } from '../components/ui.jsx'

const inviteLink = (id) => `${location.origin}${location.pathname}?give=${encodeURIComponent(id)}`

export function Send() {
  const { session, everyone, notify } = useStore()
  const { id } = useParams()
  const navigate = useNavigate()
  const [to, setTo] = useState(id || '')
  const [circle, setCircle] = useState('Amigos')
  const [tags, setTags] = useState({})

  const send = async () => {
    await api.sendMight(session.meId, to, circle, picked(tags))
    notify('MighT enviado. Vais ver que essa pessoa vai retribuir!')
    navigate('/ask')
  }

  return (
    <>
      <Header title="Manda MighT" />
      <p>Reconhece as pessoas que te são mais próximas.</p>
      {everyone.length > 0 && <PersonSelect key={id} value={to} onChange={setTo} placeholder="@tag ou nome" />}
      <Button to="/share" icon="qr" alt>Ligar por QR code</Button>
      <h3>Círculo</h3>
      <CircleChips value={circle} onChange={setCircle} />
      <h3>3 palavras</h3>
      <TagPicker value={tags} onChange={setTags} />
      <Button icon="send" disabled={!to || picked(tags).length < 3} onClick={send}>Enviar MighT</Button>
    </>
  )
}

export function Ask() {
  const { session, links, notify } = useStore()
  const [to, setTo] = useState('')
  const [round, setRound] = useState(0)
  const sent = links.some((l) => l.from === session.meId)

  const ask = async () => {
    await api.requestMight(session.meId, to)
    notify('Pedido enviado')
    setTo('')
    setRound(round + 1)
  }

  if (!sent)
    return (
      <>
        <Header title="Pede MighT" />
        <h1>Primeiro dá, depois pede</h1>
        <p>Envia um MighT para desbloquear os pedidos.</p>
        <Button to="/send" icon="send">Mandar um MighT</Button>
      </>
    )
  return (
    <>
      <Header title="Pede MighT" />
      <p>Pede a quem te conhece melhor. Quem recebe não precisa de criar conta.</p>
      <PersonSelect key={round} value={to} onChange={setTo} placeholder="@tag ou nome" />
      <Button icon="request" disabled={!to} onClick={ask}>Enviar pedido</Button>
      <Button to="/share" icon="qr" alt>QR code e link</Button>
      <Button to="/inbox" icon="inbox" alt>Caixa de MighTs</Button>
    </>
  )
}

export function Share() {
  const { session, me, notify } = useStore()
  const link = inviteLink(session.meId)
  const svg = useMemo(() => {
    const qr = qrcode(0, 'M')
    qr.addData(link)
    qr.make()
    return qr.createSvgTag({ scalable: true })
  }, [link])
  const copy = async (value, message) => {
    await navigator.clipboard.writeText(value)
    notify(message)
  }
  return (
    <>
      <Header title="O meu QR" />
      <h1 className="center">{me?.handle}</h1>
      <div className="qr" dangerouslySetInnerHTML={{ __html: svg }} />
      <p className="center">Quem ler este código liga-se a ti e pode mandar-te um MighT.</p>
      <Button icon="copy" onClick={() => copy(link, 'Link copiado')}>Copiar link</Button>
      <Button icon="profile" alt onClick={() => copy(me?.handle, '@ copiado')}>Copiar o meu @</Button>
      <Button to={`/give/${encodeURIComponent(session.meId)}`} icon="users" alt>Ver como convidado</Button>
    </>
  )
}

export function Give() {
  const { id } = useParams()
  const { session, everyone, ready, notify } = useStore()
  const navigate = useNavigate()
  const person = everyone.find((p) => p.id === id)
  const own = session.meId === id
  const asGuest = !session.meId || own
  const [name, setName] = useState('')
  const [circle, setCircle] = useState('Amigos')
  const [tags, setTags] = useState({})

  const send = async () => {
    const from = asGuest ? await api.createPerson(name.trim(), []) : session.meId
    await api.sendMight(from, id, circle, picked(tags))
    notify('MighT enviado. Obrigado!')
    navigate(own ? '/inbox' : session.meId ? '/home' : '/')
  }

  if (!ready) return <p>A carregar...</p>
  if (!person)
    return (
      <>
        <h2>Convite não encontrado</h2>
        <p>Nesta versão de demonstração o convite só abre no mesmo browser onde foi criado.</p>
        <Button to="/">Criar o meu MighT</Button>
      </>
    )
  return (
    <>
      <Header title="Ligação" />
      <h1>{person.name}</h1>
      <p className="hint">{person.handle} · pede-te um MighT</p>
      {asGuest && (
        <>
          <p>Não precisas de conta.</p>
          <input value={name} placeholder="O teu primeiro nome" onChange={(e) => setName(e.target.value)} />
        </>
      )}
      <CircleChips value={circle} onChange={setCircle} />
      <TagPicker value={tags} onChange={setTags} />
      <Button icon="send" disabled={(asGuest && !name.trim()) || picked(tags).length < 3} onClick={send}>Enviar MighT</Button>
    </>
  )
}

export function Inbox() {
  const { session, profile, everyone, links } = useStore()
  const nameOf = (id) => everyone.find((p) => p.id === id)?.name || id
  const answered = links.filter((l) => l.to === session.meId && l.status !== 'pending')
  return (
    <>
      <Header title="Caixa" />
      <p>{profile?.received || 0} de {UNLOCK_AT} MighTs aceites. Nada fica público sem o teu consentimento.</p>
      {profile?.pending.map((m, i) => (
        <div key={`${m.from}${i}`} className="panel">
          <b>{nameOf(m.from)} · {m.circle}</b>
          <Tags ids={m.tags} />
          <div className="row">
            <Button icon="check" onClick={() => api.answerMight(session.meId, m.from, true)}>Aceitar</Button>
            <Button icon="close" alt onClick={() => api.answerMight(session.meId, m.from, false)}>Recusar</Button>
          </div>
        </div>
      ))}
      {!profile?.pending.length && <div className="panel center"><p>Sem MighTs por responder.</p></div>}
      {profile?.unlocked ? <Button to="/all" icon="stats">Ver o meu All MighT</Button> : <Button to="/ask" icon="request" alt>Pedir MighTs</Button>}
      {answered.length > 0 && <h3>Respondidos</h3>}
      {answered.map((l, i) => (
        <div key={i} className="panel">
          <b>{nameOf(l.from)} · {l.circle}</b>
          <Tags ids={l.tags} />
          <small>{l.status === 'accepted' ? 'Aceite' : 'Recusado'}</small>
        </div>
      ))}
    </>
  )
}
