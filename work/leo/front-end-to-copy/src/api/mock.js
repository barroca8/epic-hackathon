import seedPeople from '../data/people.json'
import seedMights from '../data/mights.json'
import { UNLOCK_AT, CIRCLES } from '../config.js'
import { pickAvatar } from '../lib/avatar.js'
import { weights } from '../lib/matching.js'

const KEY = 'might.mock'
const listeners = new Set()
const people = seedPeople
  .filter((p) => p.kind === 'person')
  .map((p) => ({ id: p.id, name: p.name, group: p.group, selfTags: p.self_tags }))

const read = () => JSON.parse(localStorage.getItem(KEY) || '{"people":[],"links":[]}')
const emit = () => listeners.forEach((cb) => cb())
const write = (change) => {
  const db = read()
  change(db)
  localStorage.setItem(KEY, JSON.stringify(db))
  emit()
}
const allPeople = () => [...people, ...read().people]
const allLinks = () => [...seedMights, ...read().links]
const slug = (s) =>
  s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const SAMPLE = [
  ['tag:curious', 'tag:creator', 'tag:collaboration'],
  ['tag:optimistic', 'tag:connector', 'tag:generosity'],
  ['tag:imaginative', 'tag:solver', 'tag:courage'],
]

function receive(personId, fromId, accepted = false) {
  const me = allPeople().find((p) => p.id === personId)
  if (!me) return
  const links = read().links
  const taken = new Set(links.filter((l) => l.to === personId).map((l) => l.from))
  const from = fromId && !taken.has(fromId) ? fromId : people.filter((p) => !taken.has(p.id))[(links.length * 7 + 1) % 40]?.id
  if (!from) return
  const n = links.length
  const tags = SAMPLE[n % 3].map((t, i) => ((n + i) % 2 && me.selfTags[i]) || t)
  write((db) => db.links.push({ from, to: personId, circle: CIRCLES[(n + 1) % 6], tags, status: accepted ? 'accepted' : 'pending' }))
}

export const mock = {
  async createPerson(name, selfTags) {
    const id = `person:${slug(name)}-${Math.random().toString(36).slice(2, 6)}`
    write((db) => db.people.push({ id, name, group: 'Novo', selfTags }))
    return id
  },
  async listPeople() {
    return allPeople()
  },
  async listLinks() {
    return allLinks()
  },
  async sendMight(from, to, circle, tags) {
    write((db) => db.links.push({ from, to, circle, tags, status: 'pending' }))
    if (people.some((p) => p.id === to)) setTimeout(() => receive(from, to), 4000)
  },
  async requestMight(from, to) {
    setTimeout(() => receive(from, to), 2500)
  },
  async answerMight(person, from, accept) {
    write((db) => {
      db.links.filter((l) => l.to === person && l.from === from).forEach((l) => (l.status = accept ? 'accepted' : 'refused'))
    })
  },
  async getProfile(id, circle = null) {
    const person = allPeople().find((p) => p.id === id)
    if (!person) return null
    const mine = allLinks().filter((l) => l.to === id)
    const ok = mine.filter((l) => l.status === 'accepted')
    return {
      id,
      name: person.name,
      self: person.selfTags,
      pending: mine.filter((l) => l.status === 'pending'),
      received: ok.length,
      unlocked: ok.length >= UNLOCK_AT,
      circles: [...new Set(ok.map((l) => l.circle))],
      allMight: weights(ok.filter((l) => !circle || l.circle === circle).map((l) => l.tags)),
    }
  },
  async parseCv(file) {
    return { fileName: file.name, role: 'Product Designer', skills: ['Research', 'Prototipagem', 'Facilitação'] }
  },
  async connectAccount(provider) {
    if (provider === 'github')
      return { provider, title: 'GitHub ligado', lines: ['12 repositórios públicos', 'JavaScript, Python'], skills: ['developer', 'solver'] }
    return { provider, title: 'LinkedIn ligado', lines: ['Product Designer', '4 anos de percurso'], role: 'Product Designer', skills: ['creator', 'communicator'] }
  },
  async avatar(tags, signals = []) {
    await new Promise((r) => setTimeout(r, 900))
    return pickAvatar(tags, signals)
  },
  onChange(cb) {
    listeners.add(cb)
    window.addEventListener('storage', cb)
    return () => {
      listeners.delete(cb)
      window.removeEventListener('storage', cb)
    }
  },
  demo: {
    async fill() {
      const id = await mock.createPerson('Leo Reche', SAMPLE[0])
      for (let i = 0; i < 5; i++) receive(id, null, i < 4)
      return id
    },
    receive: (id) => receive(id),
    reset() {
      localStorage.removeItem(KEY)
      emit()
    },
  },
}
