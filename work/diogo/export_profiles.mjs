// Node.js 22+. Ler Supabase e gerar profiles.json + profiles.xlsx.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { preencherCamposDemo } from './demo_profiles.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FRANCISCO = path.resolve(HERE, '../francisco');
const DIMENSIONS = ['personality', 'power', 'character'];
const EXTRA_FIELDS = {
  curso: ['COURSE'], instituicao: ['INSTITUTION'], interesses: ['INTEREST', 'HAS_INTEREST'],
  competencias: ['HAS_SKILL'], objetivos: ['GOAL', 'HAS_GOAL'], funcoes: ['HELD_ROLE'],
  empresas: ['WORKED_AT'], linkedin_url: ['LINKEDIN_URL'],
};
export const HEADERS = [
  'id', 'nome', 'grupo', 'self_tags', 'mights_recebidos', 'mights_enviados',
  'self_personalidade', 'self_poder', 'self_caracter',
  ...Object.keys(EXTRA_FIELDS), 'circulos', 'mights_aceites',
  'all_personalidade', 'all_poder', 'all_caracter', 'campos_simulados',
];

export async function lerEndpoint(base, key, view, filter = {}, fetcher = fetch) {
  const data = [];
  for (let page = 0; page < 10000; page++) {
    const url = new URL(view, base);
    for (const [k, v] of Object.entries({ select: '*', order: 'id.asc', ...filter, offset: data.length, limit: 500 })) url.searchParams.set(k, v);
    const response = await fetcher(url, { headers: { apikey: key }, signal: AbortSignal.timeout(20000), redirect: 'error' });
    if (!response.ok) throw new Error(`${view}: HTTP ${response.status}; exportação cancelada.`);
    const batch = await response.json();
    if (!Array.isArray(batch)) throw new Error(`${view}: resposta JSON não é uma lista.`);
    if (!batch.length) return data;
    data.push(...batch);
  }
  throw new Error(`${view}: limite de paginação atingido.`);
}

export function montarPerfis({ participantes, ligacoes, triples = [], tags = [] }) {
  const dimensions = new Map(triples.filter(x => x.predicate === 'TAG_DIMENSION').map(x => [x.subject, x.object]));
  for (const tag of tags) if (!dimensions.has(tag.id)) dimensions.set(tag.id, tag.dimension);
  const labels = new Map(tags.map(t => [t.id, t.pt]));
  const people = new Map();
  for (const p of participantes) {
    if (!p.id || people.has(p.id)) throw new Error(`ID de participante ausente ou repetido: ${p.id}`);
    if (typeof p.nome !== 'string' || !Array.isArray(p.self_tags)) throw new Error(`Perfil inválido: ${p.id}`);
    const self = Object.fromEntries(DIMENSIONS.map(d => [d, []]));
    for (const tag of p.self_tags) {
      const dimension = dimensions.get(tag);
      if (!self[dimension]) throw new Error(`Dimensão desconhecida para ${tag}`);
      self[dimension].push(tag);
    }
    people.set(p.id, {
      ...p, self_might: self,
      ...Object.fromEntries(Object.keys(EXTRA_FIELDS).map(k => [k, []])),
      circulos: [], mights_aceites: 0,
      all_might: Object.fromEntries(DIMENSIONS.map(d => [d, {}])),
    });
  }
  for (const t of triples) {
    const person = people.get(t.subject);
    if (!person) continue;
    for (const [field, predicates] of Object.entries(EXTRA_FIELDS)) {
      if (predicates.includes(t.predicate) && t.object != null && !person[field].includes(t.object)) person[field].push(t.object);
    }
  }
  const linkIds = new Set();
  const accepted = new Set();
  for (const link of ligacoes) {
    if (link.id == null || linkIds.has(link.id)) throw new Error('ID de ligação ausente ou repetido.');
    linkIds.add(link.id);
    if (!people.has(link.remetente) || !people.has(link.destinatario)) throw new Error('Ligação refere uma pessoa fora do conjunto exportado.');
    if (link.estado !== 'aceite') continue;
    const person = people.get(link.destinatario);
    if (!Array.isArray(link.tags)) throw new Error(`Tags inválidas na ligação ${link.id}`);
    person.mights_aceites++;
    accepted.add(JSON.stringify([link.destinatario, link.remetente]));
    if (link.circulo && !person.circulos.includes(link.circulo)) person.circulos.push(link.circulo);
  }
  // A view ligacoes agrega tags por par de pessoas. Contar os triplos
  // RECEIVED_TAG uma única vez evita duplicação quando o par se repete.
  for (const row of triples) {
    if (row.predicate !== 'RECEIVED_TAG' || !accepted.has(JSON.stringify([row.subject, row.source]))) continue;
    const person = people.get(row.subject);
    const dimension = dimensions.get(row.object);
    if (!person?.all_might[dimension]) throw new Error(`Dimensão desconhecida para ${row.object}`);
    person.all_might[dimension][row.object] = (person.all_might[dimension][row.object] ?? 0) + 1;
  }
  const weights = [];
  for (const p of people.values()) {
    for (const dimension of DIMENSIONS) {
      const counts = Object.entries(p.all_might[dimension]).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
      const total = counts.reduce((sum, [, count]) => sum + count, 0);
      p.all_might[dimension] = Object.fromEntries(counts.map(([tag, count]) => [tag, count / total]));
      for (const [tag, count] of counts) weights.push([p.id, p.nome, dimension, tag, labels.get(tag) ?? tag, count, count / total]);
    }
  }
  const profiles = Object.fromEntries(people);
  return { profiles, rows: linhasPerfis(profiles, labels), weights };
}

export function linhasPerfis(profiles, labels = new Map()) {
  return Object.values(profiles).map(p => [
    p.id, p.nome, p.grupo ?? null, p.self_tags.join('; '), p.mights_recebidos, p.mights_enviados,
    ...DIMENSIONS.map(d => p.self_might[d].map(t => labels.get(t) ?? t).join('; ') || null),
    ...Object.keys(EXTRA_FIELDS).map(k => p[k].join('; ') || null),
    p.circulos.join('; '), p.mights_aceites,
    ...DIMENSIONS.map(d => Object.keys(p.all_might[d]).length ? JSON.stringify(p.all_might[d]) : null),
    p._demo?.campos?.join('; ') || null,
  ]);
}

async function artifactTool() {
  const roots = [process.env.ARTIFACT_NODE_MODULES, path.join(process.cwd(), 'node_modules')].filter(Boolean);
  if (process.platform === 'win32' && process.env.ProgramFiles) {
    const apps = path.join(process.env.ProgramFiles, 'WindowsApps');
    for (const name of (await fs.readdir(apps).catch(() => [])).filter(n => n.startsWith('OpenAI.CodexPrimaryRuntime.')).sort().reverse()) {
      roots.push(path.join(apps, name, 'dependencies/node/node_modules'));
    }
  }
  for (const root of roots) {
    try {
      const require = createRequire(path.join(root, '__profiles.cjs'));
      return await import(pathToFileURL(require.resolve('@oai/artifact-tool')).href);
    } catch (error) {
      if (!['MODULE_NOT_FOUND', 'ERR_MODULE_NOT_FOUND', 'ENOENT'].includes(error.code)) throw error;
    }
  }
  throw new Error('Define ARTIFACT_NODE_MODULES para a pasta node_modules do runtime Codex.');
}

function column(n) { let s = ''; while (n) { n--; s = String.fromCharCode(65 + n % 26) + s; n = Math.floor(n / 26); } return s; }
const excelText = value => typeof value === 'string' && /^[=+@-]/.test(value) ? `'${value}` : value;

export async function escreverExcel(data, ligacoes, output, previewDir = null) {
  const { Workbook, SpreadsheetFile } = await artifactTool();
  const wb = Workbook.create();
  function sheet(name, headers, rows, tableName) {
    const ws = wb.worksheets.add(name);
    const end = column(headers.length);
    const all = [headers, ...rows.map(row => row.map(excelText))];
    ws.getRange(`A1:${end}${all.length}`).values = all;
    ws.getRange(`A1:${end}${all.length}`).format = { font: { name: 'Arial', size: 10 }, verticalAlignment: 'center', rowHeight: 22 };
    ws.getRange(`A1:${end}1`).format = { fill: '#000000', font: { name: 'Arial', size: 10, bold: true, color: '#FFFFFF' }, wrapText: true, rowHeight: 38 };
    ws.getRange(`A1:${end}${all.length}`).format.columnWidth = 24;
    ws.getRange(`A1:A${all.length}`).format.columnWidth = 42;
    ws.getRange(`B1:B${all.length}`).format.columnWidth = 32;
    if (rows.length) ws.tables.add(`A1:${end}${all.length}`, true, tableName);
    ws.freezePanes.freezeRows(1);
    ws.showGridLines = false;
    return ws;
  }
  const p = sheet('Participantes', HEADERS, data.rows, 'PerfisParticipantes');
  p.getRange(`D1:D${data.rows.length + 1}`).format.columnWidth = 46;
  for (const col of ['T', 'U', 'V']) p.getRange(`${col}1:${col}${data.rows.length + 1}`).format.columnWidth = 48;
  p.getRange(`J2:R${data.rows.length + 1}`).format.wrapText = true;
  p.getRange(`J2:R${data.rows.length + 1}`).format.rowHeight = 72;
  for (const col of ['J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'W']) p.getRange(`${col}1:${col}${data.rows.length + 1}`).format.columnWidth = 38;
  p.getRange(`W2:W${data.rows.length + 1}`).format.wrapText = true;
  const linkHeaders = ['id', 'remetente', 'destinatario', 'circulo', 'tags', 'estado', 'created_at'];
  sheet('Ligações', linkHeaders, ligacoes.map(link => linkHeaders.map(k => Array.isArray(link[k]) ? link[k].join('; ') : link[k] ?? null)), 'LigacoesMight');
  const w = sheet('Pesos MighT', ['id', 'nome', 'dimensao', 'tag_id', 'tag_pt', 'contagem', 'peso'], data.weights, 'PesosMight');
  if (data.weights.length) {
    w.getRange(`G2:G${data.weights.length + 1}`).setNumberFormat('0.0%');
    w.getRange(`F2:F${data.weights.length + 1}`).setNumberFormat('0');
  }
  wb.recalculate();
  if (previewDir) {
    await fs.mkdir(previewDir, { recursive: true });
    for (const [name, range] of [['Participantes', 'J1:Q5'], ['Pesos MighT', 'A1:G7']]) {
      const blob = await wb.render({ sheetName: name, range, scale: 1, format: 'png' });
      await fs.writeFile(path.join(previewDir, name + '.png'), new Uint8Array(await blob.arrayBuffer()));
    }
  }
  await (await SpreadsheetFile.exportXlsx(wb)).save(output);
}

export async function conexao() {
  const graph = await fs.readFile(path.join(FRANCISCO, 'graph.js'), 'utf8');
  const config = graph.match(/createClient\(\s*"([^"]+)"\s*,\s*"([^"]+)"/);
  const base = (process.env.SUPABASE_URL ?? config?.[1])?.replace(/\/$/, '') + '/rest/v1/';
  const key = process.env.SUPABASE_ANON_KEY ?? config?.[2];
  if (!key || base.startsWith('undefined')) throw new Error('Configuração Supabase não encontrada no graph.js ou no ambiente.');
  return { base, key };
}

export async function exportar({ output = HERE, previewDir = null, demo = false } = {}) {
  const { base, key } = await conexao();
  const [participantes, ligacoes, triples, tags] = await Promise.all([
    lerEndpoint(base, key, 'participantes'), lerEndpoint(base, key, 'ligacoes'), lerEndpoint(base, key, 'triples'),
    fs.readFile(path.join(FRANCISCO, 'graph/tags.json'), 'utf8').then(JSON.parse),
  ]);
  if (!participantes.length) throw new Error('Endpoint participantes vazio; o ficheiro existente não foi alterado.');
  const data = montarPerfis({ participantes, ligacoes, triples, tags });
  if (demo) {
    data.profiles = preencherCamposDemo(data.profiles);
    data.rows = linhasPerfis(data.profiles, new Map(tags.map(t => [t.id, t.pt])));
  }
  await fs.mkdir(output, { recursive: true });
  const stagedXlsx = path.join(output, 'profiles.tmp.xlsx');
  const stagedJson = path.join(output, 'profiles.tmp.json');
  await escreverExcel(data, ligacoes, stagedXlsx, previewDir);
  await fs.writeFile(stagedJson, JSON.stringify(data.profiles, null, 2) + '\n', 'utf8');
  await fs.rename(stagedXlsx, path.join(output, 'profiles.xlsx'));
  await fs.rename(stagedJson, path.join(output, 'profiles.json'));
  return { participantes: participantes.length, ligacoes: ligacoes.length, pesos: data.weights.length, excel: path.join(output, 'profiles.xlsx') };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  exportar({ previewDir: process.env.PROFILES_PREVIEW_DIR, demo: process.argv.includes('--demo') }).then(result => console.log(JSON.stringify(result))).catch(error => { console.error(error.message); process.exitCode = 1; });
}
