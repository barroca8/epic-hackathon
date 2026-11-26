import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from './api/index.js'
import { similarity, weights } from './lib/matching.js'
import { withHandles } from './lib/handle.js'

const KEY = 'might.session'
const EMPTY = { meId: null, name: '', selfTags: {}, cv: null, accounts: {}, avatar: null }
const Store = createContext(null)
export const useStore = () => useContext(Store)

export function StoreProvider({ children }) {
  const [session, setSession] = useState(() => ({ ...EMPTY, ...JSON.parse(localStorage.getItem(KEY) || '{}') }))
  const [data, setData] = useState({ people: [], links: [], profile: null, ready: false })
  const [toast, setToast] = useState('')

  const update = useCallback((patch) => setSession((s) => ({ ...s, ...patch })), [])
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(session))
  }, [session])

  const refresh = useCallback(async () => {
    const [people, links, profile] = await Promise.all([
      api.listPeople(),
      api.listLinks(),
      session.meId ? api.getProfile(session.meId) : null,
    ])
    setData({ people, links, profile, ready: true })
  }, [session.meId])

  useEffect(() => {
    refresh()
    return api.onChange(refresh)
  }, [refresh])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 2600)
    return () => clearTimeout(timer)
  }, [toast])

  const everyone = useMemo(() => {
    const received = {}
    for (const l of data.links) if (l.status === 'accepted') (received[l.to] ??= []).push(l.tags)
    return withHandles(data.people).map((p) => ({ ...p, weights: weights(received[p.id] || [p.selfTags]) }))
  }, [data.people, data.links])

  const me = everyone.find((p) => p.id === session.meId)

  const mine = useMemo(() => {
    const p = data.profile
    return p?.unlocked ? p.allMight : weights([p?.self || []])
  }, [data.profile])

  const ranked = useCallback(
    (dimension = null) =>
      everyone
        .filter((p) => p.id !== session.meId)
        .map((p) => ({ ...p, match: similarity(mine, p.weights, dimension) }))
        .sort((a, b) => b.match - a.match),
    [everyone, mine, session.meId],
  )

  const reset = () => setSession(EMPTY)
  const value = { session, update, reset, ...data, everyone, me, mine, ranked, toast, notify: setToast }
  return <Store.Provider value={value}>{children}</Store.Provider>
}
