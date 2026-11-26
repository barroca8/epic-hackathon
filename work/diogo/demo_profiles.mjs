// Dados fictícios reprodutíveis, agrupados para haver afinidades testáveis.
const AREAS = [
  {
    curso: 'Engenharia Mecânica', instituicoes: ['Instituto Superior Técnico', 'FEUP', 'Universidade de Aveiro'],
    interesses: ['Hidrogénio', 'Energias renováveis', 'Mobilidade sustentável', 'Robótica'],
    competencias: ['skill:cad', 'skill:python', 'skill:simulation', 'skill:project-management'],
    funcoes: ['role:mechanical-engineer', 'role:energy-engineer'], empresas: ['company:demo-helio-lab', 'company:demo-eco-motion'],
  },
  {
    curso: 'Engenharia Eletrotécnica', instituicoes: ['Instituto Superior Técnico', 'FEUP', 'Universidade de Aveiro'],
    interesses: ['Robótica', 'Energias renováveis', 'Automação', 'Inteligência artificial'],
    competencias: ['skill:python', 'skill:electronics', 'skill:automation', 'skill:project-management'],
    funcoes: ['role:electrical-engineer', 'role:automation-engineer'], empresas: ['company:demo-helio-lab', 'company:demo-robotica-nova'],
  },
  {
    curso: 'Engenharia Informática', instituicoes: ['Instituto Superior Técnico', 'Universidade do Minho', 'Universidade de Aveiro'],
    interesses: ['Inteligência artificial', 'Análise de dados', 'Desenvolvimento web', 'Robótica'],
    competencias: ['skill:python', 'skill:sql', 'skill:data-analysis', 'skill:web-development'],
    funcoes: ['role:software-engineer', 'role:data-analyst'], empresas: ['company:demo-data-lab', 'company:demo-nova-digital'],
  },
  {
    curso: 'Gestão', instituicoes: ['ISEG', 'Nova SBE', 'ISCTE'],
    interesses: ['Empreendedorismo', 'Gestão de projetos', 'Inovação', 'Sustentabilidade'],
    competencias: ['skill:project-management', 'skill:excel', 'skill:leadership', 'skill:communication'],
    funcoes: ['role:project-manager', 'role:business-analyst'], empresas: ['company:demo-nova-digital', 'company:demo-circular-future'],
  },
  {
    curso: 'Design de Comunicação', instituicoes: ['Faculdade de Belas-Artes da Universidade de Lisboa', 'Universidade de Aveiro', 'ESAD'],
    interesses: ['Design de produto', 'Experiência do utilizador', 'Criatividade', 'Inovação'],
    competencias: ['skill:ux-design', 'skill:user-research', 'skill:prototyping', 'skill:communication'],
    funcoes: ['role:product-designer', 'role:ux-designer'], empresas: ['company:demo-studio-norte', 'company:demo-nova-digital'],
  },
  {
    curso: 'Psicologia', instituicoes: ['Universidade de Lisboa', 'ISCTE', 'Universidade do Porto'],
    interesses: ['Desenvolvimento de pessoas', 'Trabalho em equipa', 'Educação', 'Comunicação'],
    competencias: ['skill:communication', 'skill:leadership', 'skill:user-research', 'skill:people-development'],
    funcoes: ['role:people-talent-specialist', 'role:community-specialist'], empresas: ['company:demo-people-lab', 'company:demo-aprender-mais'],
  },
  {
    curso: 'Marketing', instituicoes: ['ISCTE', 'IPAM', 'Universidade de Aveiro'],
    interesses: ['Comunicação', 'Criatividade', 'Análise de dados', 'Empreendedorismo'],
    competencias: ['skill:marketing', 'skill:communication', 'skill:data-analysis', 'skill:user-research'],
    funcoes: ['role:growth-specialist', 'role:community-specialist'], empresas: ['company:demo-studio-norte', 'company:demo-data-lab'],
  },
  {
    curso: 'Engenharia do Ambiente', instituicoes: ['Instituto Superior Técnico', 'FEUP', 'Universidade de Aveiro'],
    interesses: ['Sustentabilidade', 'Energias renováveis', 'Economia circular', 'Hidrogénio'],
    competencias: ['skill:data-analysis', 'skill:excel', 'skill:project-management', 'skill:environmental-assessment'],
    funcoes: ['role:environmental-engineer', 'role:sustainability-analyst'], empresas: ['company:demo-circular-future', 'company:demo-eco-motion'],
  },
];
const OBJETIVOS = ['Encontrar pessoas para um projeto', 'Explorar novas carreiras', 'Encontrar mentoria', 'Aprender novas competências', 'Partilhar conhecimento'];
const TEMAS = ['Inovação', 'Sustentabilidade', 'Inteligência artificial', 'Trabalho em equipa'];
const GERAIS = ['skill:communication', 'skill:excel', 'skill:project-management', 'skill:python'];

function randomPorId(id, seed) {
  let state = seed >>> 0;
  for (const c of id) state = Math.imul(state ^ c.charCodeAt(0), 16777619) >>> 0;
  return () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 4294967296; };
}
const unico = values => [...new Set(values)];

export function preencherCamposDemo(profiles, seed = 20261126) {
  const result = structuredClone(profiles);
  for (const [id, profile] of Object.entries(result)) {
    const random = randomPorId(id, seed);
    const pick = values => values[Math.floor(random() * values.length)];
    const subset = (values, count) => {
      const available = [...values], chosen = [];
      while (chosen.length < count && available.length) chosen.push(available.splice(Math.floor(random() * available.length), 1)[0]);
      return chosen;
    };
    const area = pick(AREAS);
    const sample = {
      curso: [area.curso], instituicao: [pick(area.instituicoes)],
      interesses: unico([...subset(area.interesses, 3), pick(TEMAS)]),
      competencias: unico([...subset(area.competencias, 3), pick(GERAIS)]),
      objetivos: subset(OBJETIVOS, 2), funcoes: [pick(area.funcoes)], empresas: [pick(area.empresas)],
      linkedin_url: ['https://example.com/linkedin-demo/' + encodeURIComponent(id.replace(/^person:/, ''))],
    };
    const fields = [];
    for (const [key, value] of Object.entries(sample)) {
      if (profile[key] == null || (Array.isArray(profile[key]) && !profile[key].length) || profile[key] === '') {
        profile[key] = value;
        fields.push(key);
      }
    }
    if (fields.length) profile._demo = { tipo: 'dados_ficticios', seed, campos: fields };
  }
  return result;
}
