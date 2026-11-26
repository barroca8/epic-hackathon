import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/index.js'
import { UNLOCK_AT } from '../config.js'
import { drawCard } from '../lib/card.js'
import { topTags } from '../lib/matching.js'
import { label } from '../lib/tags.js'
import { useStore } from '../store.jsx'
import Icon from '../components/icons.jsx'
import { Button, Chips, CircleChips, Figure, Header, Locked, Tags, picked } from '../components/ui.jsx'
import { Connections } from './onboarding.jsx'

export function Home() {
  const { session, me, profile, everyone, links } = useStore()
  const waiting = profile?.pending.length
  const accepted = Math.min(profile?.received || 0, UNLOCK_AT)
  const givers = links.filter((l) => l.to === session.meId && l.status === 'accepted')
  return (
    <>
      <header>
        <Link to="/profile"><h1>{session.name}</h1><small className="hint">{me?.handle}</small></Link>
        <span className="grow" />
        <Link className="ib" to="/share" aria-label="O meu QR"><Icon name="qr" /></Link>
        <Link className="ib" to="/inbox" aria-label="Caixa">
          <Icon name="inbox" />
          {waiting > 0 && <span className="badge">{waiting}</span>}
        </Link>
      </header>
      <div className="pedestal"><Figure avatar={session.avatar} /></div>
      <h2>{profile?.unlocked ? 'All MighT desbloqueado' : `Coleciona ${UNLOCK_AT} MighTs (${accepted}/${UNLOCK_AT})`}</h2>
      <div className="slots">
        {Array.from({ length: UNLOCK_AT }, (_, i) => (
          <Link key={i} to="/inbox" className={i < accepted ? 'slot full' : 'slot'}>
            <Icon name={i < accepted ? 'check' : 'lock'} size={24} />
            {i < accepted ? everyone.find((p) => p.id === givers[i]?.from)?.name.split(' ')[0] : 'Vazio'}
          </Link>
        ))}
      </div>
      {profile?.unlocked ? <Button to="/all" icon="stats">Ver o meu All MighT</Button> : <Button to="/ask" icon="request">Pedir um MighT</Button>}
      <Button to="/roles" icon="roles" alt>Funções ideais</Button>
    </>
  )
}

export function AllMight() {
  const { session, profile } = useStore()
  const [circle, setCircle] = useState(null)
  const [view, setView] = useState(null)

  useEffect(() => {
    if (session.meId) api.getProfile(session.meId, circle).then(setView)
  }, [session.meId, circle, profile])

  if (!profile?.unlocked)
    return (
      <>
        <Header title="All MighT" />
        <Locked title={`Faltam ${UNLOCK_AT - (profile?.received || 0)} MighTs`} text="Agora é uma questão de tempo." />
      </>
    )
  if (!view) return <Header title="All MighT" />

  const weights = view.allMight
  const self = profile.self
  const others = Object.values(weights).flatMap((d) => Object.keys(d))
  const confirmed = self.filter((t) => others.includes(t))
  const score = self.length ? Math.round((100 * confirmed.length) / self.length) : 0
  const groups = [
    ['Confirmado', 'O que dizes de ti e os outros confirmam', confirmed, true],
    ['Superpoderes secretos', 'O que os outros veem e tu não disseste', others.filter((t) => !self.includes(t)), true],
    ['Talentos escondidos', 'O que dizes de ti e os outros ainda não sabem', self.filter((t) => !others.includes(t)), false],
  ]
  return (
    <>
      <Header title="All MighT" />
      <Chips options={[[null, 'Todos'], ...profile.circles.map((c) => [c, c])]} value={circle} onChange={setCircle} />
      <Figure avatar={session.avatar} size="md" />
      <div className="cloud">
        {others.map((t) => {
          const w = Object.values(weights).find((d) => t in d)[t]
          return <span key={t} style={{ fontSize: 14 + w * 22 }}>{label(t)}</span>
        })}
      </div>
      <div className="panel center">
        <h1>{score}%</h1>
        <p>{confirmed.length} das tuas {self.length} palavras foram confirmadas</p>
      </div>
      {groups.map(([title, text, ids, showWeight]) => (
        <div key={title} className="panel">
          <b>{title}</b>
          <small>{text}</small>
          {ids.length ? <Tags ids={ids} weights={showWeight ? weights : undefined} /> : <small>Nada ainda</small>}
        </div>
      ))}
      <Button to="/card" icon="card">Criar MighT Card</Button>
      <Button to="/people" icon="search" alt>Pessoas como tu</Button>
    </>
  )
}

export function Card() {
  const { session, me, profile, mine, notify } = useStore()
  const [format, setFormat] = useState('portrait')
  const [image, setImage] = useState('')
  const unlocked = profile?.unlocked

  useEffect(() => {
    if (!unlocked) return
    drawCard({ name: session.name, avatar: session.avatar, tags: topTags(mine), circles: profile.circles, format })
      .then(setImage)
      .catch(() => notify('Não foi possível criar o cartão'))
  }, [unlocked, format, mine])

  const share = async () => {
    const blob = await (await fetch(image)).blob()
    const files = [new File([blob], 'might-card.png', { type: 'image/png' })]
    if (navigator.canShare?.({ files })) return navigator.share({ files }).catch(() => {})
    await navigator.clipboard.writeText(`${session.name} ${me?.handle}`)
    notify('Partilha não disponível: o teu @ foi copiado')
  }

  return (
    <>
      <Header title="O meu cartão" />
      {!unlocked ? (
        <Locked title="Cartão bloqueado" text={`Precisas de ${UNLOCK_AT} MighTs aceites.`} />
      ) : (
        <>
          <Chips options={[['portrait', 'Retrato'], ['linkedin', 'LinkedIn']]} value={format} onChange={setFormat} />
          {image && <img className="card" src={image} alt="MighT Card" />}
          <a className="btn" href={image} download={`might-card-${format}.png`}><Icon name="download" />Descarregar PNG</a>
          <Button icon="share" alt onClick={share}>Partilhar</Button>
          <Button to="/people" icon="search" alt>Descobrir pessoas como tu</Button>
        </>
      )}
    </>
  )
}

export function Profile() {
  const { session, me, profile, reset } = useStore()
  const navigate = useNavigate()
  const leave = () => {
    reset()
    navigate('/')
  }
  return (
    <>
      <Header title="Perfil" />
      <Figure avatar={session.avatar} size="md" />
      <h1 className="center">{session.name}</h1>
      <p className="center hint">{me?.handle}</p>
      <Tags ids={profile?.self || picked(session.selfTags)} />
      <p className="quote">«{session.avatar?.tagline}»</p>
      {session.cv && <div className="panel"><small>CV</small><b>{session.cv.fileName}</b><small>{session.cv.role}</small></div>}
      <Connections />
      <Button to="/share" icon="qr">O meu QR code</Button>
      <Button icon="close" alt onClick={leave}>Terminar sessão</Button>
    </>
  )
}
