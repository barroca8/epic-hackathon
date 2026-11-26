export const UNLOCK_AT = 3

export const CIRCLES = ['Família', 'Amigos', 'Colegas', 'Escola', 'Comunidade', 'Clientes']

export const DIMENSIONS = [
  { id: 'personality', label: 'Personalidade', part: 'head', hint: 'Como és' },
  { id: 'power', label: 'Poder', part: 'body', hint: 'O teu talento' },
  { id: 'character', label: 'Carácter', part: 'arms', hint: 'O que valorizas' },
]

export const PROVIDERS = [
  { id: 'linkedin', name: 'LinkedIn', badge: 'in', color: '#3a66bd', text: 'Cargo atual e percurso: o “Agora” nas tuas funções' },
  { id: 'github', name: 'GitHub', badge: 'gh', color: '#1c1e28', text: 'Repositórios e linguagens: provas para as tuas tags' },
]

export const NAV = [
  { to: '/home', label: 'Início', icon: 'home' },
  { to: '/people', label: 'Pessoas', icon: 'search' },
  { to: '/send', label: 'Mandar', icon: 'send', main: true },
  { to: '/graph', label: 'Rede', icon: 'graph' },
  { to: '/card', label: 'Cartão', icon: 'card' },
]
