// Chooses the figure for a person. Each artwork has the traits it expresses best;
// the person's words count 2 points, signals from CV and connected accounts count 1.
import { label } from './tags.js'

const ART = {
  a1: 'logic composer planner tolerance',
  a2: 'practical organizer discipline responsibility',
  a3: 'intuitive writer learner imaginative maturity',
  a4: 'optimistic moderator compassion sensitive',
  a5: 'adaptable connector solidarity',
  a6: 'people-oriented encourager generosity',
  a7: 'confident leader integrity',
  a8: 'optimistic energizer collaboration humorous',
  a9: 'sensitive strategizer freedom wise',
  surf: 'adaptable explorer freedom curious',
  'pop-art': 'extroverted entertainer influencer humorous',
  modrian: 'logic conceptualizer analyzer developer objective curious',
  'art-deco': 'objective communicator persuasive integrity',
  hippie: 'passionate achiever altruism generosity',
  matrioska: 'wise advisor humility maturity',
  'mystic-pink': 'intuitive creator innovator passionate courage',
  'retro-mandala': 'intelligent solver investigator persistence sincerity',
  'air-force': 'competitive achiever entrepreneur courage discipline',
  'diogo-machado': 'imaginative illustrator creator compassion',
}
const COLORS = ['#753065', '#144B86', '#358EC0', '#3D9061', '#0A5AA9', '#E88F3D', '#A7CDF3', '#C87BCE']
const PATTERNS = ['solid', 'stripes', 'dots', 'zigzag', 'grid', 'waves', 'checker', 'triangles']
const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)
const bare = (t) => t.replace('tag:', '')

export function pickAvatar(tags, signals = []) {
  const words = tags.map(bare)
  const key = words.join('|')
  const score = ([name, traits]) => {
    const list = traits.split(' ')
    return (
      words.filter((w) => list.includes(w)).length * 2 +
      signals.filter((s) => list.includes(s)).length +
      (hash(key + name) % 1000) / 1001
    )
  }
  const [art, traits] = Object.entries(ART).sort((a, b) => score(b) - score(a))[0]
  const part = (t) => t && ({ tag: t, color: COLORS[hash(t) % COLORS.length], pattern: PATTERNS[hash(t + 'p') % PATTERNS.length] })
  const [head, body, arms] = tags
  return {
    art,
    head: part(head),
    body: part(body),
    arms: part(arms),
    tagline: `${label(head)} por natureza. Talento de ${label(body)}. Alma de ${label(arms)}.`,
    reason: tags.filter((t) => traits.split(' ').includes(bare(t))).map(label),
    source: 'mock',
  }
}
