// Publicação idempotente: apenas novos perfis ou estados alterados.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { conexao, lerEndpoint } from './export_profiles.mjs';

export const SOURCE = 'diogo:profiles:v1';

export async function publicar() {
  const { base, key } = await conexao();
  const profiles = JSON.parse(await fs.readFile(new URL('./profiles.json', import.meta.url), 'utf8'));
  const old = await lerEndpoint(base, key, 'triples', { predicate: 'eq.PROFILE', source: `eq.${SOURCE}` });
  const latest = new Map(old.map(row => [row.subject, row.object]));
  const rows = Object.entries(profiles).map(([id, profile]) => ({
    subject: id, predicate: 'PROFILE', object: JSON.stringify(profile), source: SOURCE,
  })).filter(row => latest.get(row.subject) !== row.object);
  if (rows.length) {
    const response = await fetch(new URL('triples', base), {
      method: 'POST', headers: { apikey: key, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify(rows), signal: AbortSignal.timeout(20000), redirect: 'error',
    });
    if (!response.ok) throw new Error(`Publicação PROFILE: HTTP ${response.status}`);
    const saved = await response.json();
    if (saved.length !== rows.length) throw new Error('Número de linhas publicadas inesperado.');
  }
  const saved = await lerEndpoint(base, key, 'triples', { predicate: 'eq.PROFILE', source: `eq.${SOURCE}` });
  const verified = new Map(saved.map(row => [row.subject, row.object]));
  for (const [id, profile] of Object.entries(profiles)) {
    if (verified.get(id) !== JSON.stringify(profile)) throw new Error(`Verificação falhou: ${id}`);
  }
  return { publicados: rows.length, perfisVerificados: Object.keys(profiles).length, endpoint: new URL('triples?predicate=eq.PROFILE&source=eq.diogo%3Aprofiles%3Av1&order=id.desc', base).href };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  publicar().then(result => console.log(JSON.stringify(result))).catch(error => { console.error(error.message); process.exitCode = 1; });
}
