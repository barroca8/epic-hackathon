// Demo helpers. Rendered only while the adapter exposes `api.demo`.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/index.js'
import { pickAvatar } from '../lib/avatar.js'
import { useStore } from '../store.jsx'

export default function DemoPanel() {
  const { session, update, reset, notify } = useStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  if (!api.demo) return null

  const fill = async () => {
    api.demo.reset()
    const tags = ['tag:curious', 'tag:creator', 'tag:collaboration']
    const meId = await api.demo.fill()
    reset()
    update({
      meId,
      name: 'Leo Reche',
      selfTags: { personality: tags[0], power: tags[1], character: tags[2] },
      avatar: pickAvatar(tags),
    })
    navigate('/home')
  }
  const receive = () => {
    if (!session.meId) return notify('Cria primeiro o teu MighT')
    api.demo.receive(session.meId)
    notify('Recebeste um MighT')
  }
  const restart = () => {
    api.demo.reset()
    reset()
    navigate('/')
  }
  return (
    <div className="demo">
      {open && (
        <>
          <button onClick={fill}>Preencher demo</button>
          <button onClick={receive}>Receber MighT</button>
          <button onClick={restart}>Recomeçar</button>
        </>
      )}
      <button onClick={() => setOpen(!open)}>{open ? 'Fechar' : 'Demo'}</button>
    </div>
  )
}
