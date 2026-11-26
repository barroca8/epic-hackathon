/*  MighT · Ligações reais ao GitHub e ao LinkedIn
 *  Módulo independente (JavaScript puro, sem dependências obrigatórias).
 *
 *  GitHub  → API pública real (sem login). Token opcional só de leitura para incluir repositórios privados.
 *            Sincronização automática: volta a ler a cada X segundos e avisa quando algo muda.
 *  LinkedIn → leitura real do PDF do perfil (LinkedIn: Perfil → Mais → Guardar em PDF), feita no browser.
 *            O login com o LinkedIn só dá nome, email e foto; cargo e competências estão reservados a parceiros.
 *
 *  Uso rápido:
 *    const gh = await MightConnect.github.connect('utilizador', tokenOpcional);
 *    MightConnect.github.autoSync(60000, ({data, changes, tags}) => { ... });
 *    const li = await MightConnect.linkedin.fromPdf(ficheiroPdf);
 *    MightConnect.evidence();   // provas para as tags
 *    MightConnect.platformMighTs(); // MighTs automáticos {p, po, c} vindos das plataformas
 */
(function (root) {
  'use strict';
  const state = { gh: null, li: null, token: '', timer: null };

  /* ---------------- GitHub ---------------- */
  async function ghFetch(user, token) {
    const H = token ? { headers: { Authorization: 'Bearer ' + token } } : {};
    const TO = new Promise((_, ko) => setTimeout(() => ko(new Error('O GitHub demorou demasiado a responder')), 10000));
    const g = path => Promise.race([fetch('https://api.github.com/' + path, H), TO]);
    const u = encodeURIComponent(user);
    const [pr, rr, er] = await Promise.all([
      g(token ? 'user' : 'users/' + u),
      g(token ? 'user/repos?per_page=100&sort=pushed&affiliation=owner' : 'users/' + u + '/repos?per_page=100&sort=pushed'),
      g('users/' + u + '/events' + (token ? '' : '/public') + '?per_page=30').catch(() => ({ ok: false }))
    ]);
    if (pr.status === 401) throw new Error('O token não é válido ou expirou');
    if (pr.status === 404) throw new Error('O utilizador @' + user + ' não existe');
    if (pr.status === 403 || pr.status === 429) throw new Error('O GitHub limitou os pedidos desta rede (60 por hora sem token). Usa um token ou outra rede');
    if (!pr.ok || !rr.ok) throw new Error('O GitHub respondeu ' + pr.status);
    const p = await pr.json(), rs = await rr.json(), ev = er.ok ? await er.json() : [];
    const own = rs.filter(r => !r.fork), lang = {};
    own.forEach(r => { if (r.language) lang[r.language] = (lang[r.language] || 0) + 1; });
    const now = Date.now(), pushes = ev.filter(e => e.type === 'PushEvent');
    return {
      user: p.login, name: p.name, avatar: p.avatar_url, auth: !!token,
      repos: token ? rs.length : p.public_repos, own: own.length, priv: own.filter(r => r.private).length,
      names: own.map(r => r.name),
      stars: own.reduce((s, r) => s + r.stargazers_count, 0), followers: p.followers,
      years: Math.max(0, Math.floor((now - new Date(p.created_at)) / 3.15e10)),
      recent: own.filter(r => now - new Date(r.pushed_at) < 90 * 864e5).length,
      docs: own.filter(r => r.description).length,
      langs: Object.entries(lang).sort((a, b) => b[1] - a[1]),
      commits: pushes.reduce((s, e) => s + ((e.payload && e.payload.size) || 1), 0),
      lastEvent: ev[0] ? ev[0].id : null,
      lastPush: pushes[0] ? { repo: pushes[0].repo.name.split('/')[1], at: pushes[0].created_at } : null,
      at: now
    };
  }
  function ghTags(g) {
    return {
      p: g.langs.length >= 3 ? 'Curioso' : 'Organizado',
      po: g.commits >= 10 || g.own >= 8 ? 'Construir' : g.docs >= 3 ? 'Comunicar' : 'Criar',
      c: g.recent >= 3 || g.commits >= 5 ? 'Perseverança' : 'Compromisso'
    };
  }
  function ghDiff(o, n) {
    const out = [];
    const novos = (n.names || []).filter(x => !(o.names || []).includes(x));
    if (novos.length) out.push('novo repositório ' + novos.join(', '));
    if (n.commits > o.commits) out.push('+' + (n.commits - o.commits) + ' commits');
    if (n.stars > o.stars) out.push('+' + (n.stars - o.stars) + ' estrelas');
    if (n.lastPush && (!o.lastPush || n.lastPush.at !== o.lastPush.at)) out.push('push em ' + n.lastPush.repo);
    const a = ghTags(o), b = ghTags(n);
    ['p', 'po', 'c'].forEach(d => { if (a[d] !== b[d]) out.push(a[d] + ' → ' + b[d]); });
    return out;
  }
  const github = {
    /** Liga um utilizador. token é opcional (só leitura) e fica apenas em memória. */
    async connect(user, token) {
      user = String(user || '').trim().replace(/^@/, '').replace(/^https?:\/\/github\.com\//, '').split('/')[0];
      if (!user) throw new Error('Indica o utilizador do GitHub');
      state.token = (token || '').trim();
      state.gh = await ghFetch(user, state.token);
      return state.gh;
    },
    /** Volta a ler. Devolve {data, changes:[...], tags}. changes vazio = nada mudou. */
    async sync() {
      if (!state.gh) throw new Error('GitHub não ligado');
      const old = state.gh, data = await ghFetch(old.user, state.token);
      const changes = (data.lastEvent !== old.lastEvent || data.own !== old.own || data.stars !== old.stars) ? ghDiff(old, data) : [];
      state.gh = data;
      return { data, changes: changes.length || data.lastEvent === old.lastEvent ? changes : ['atividade nova'], tags: ghTags(data) };
    },
    /** Sincroniza sozinho. onChange só é chamado quando há mudanças. */
    autoSync(everyMs, onChange, onError) {
      clearInterval(state.timer);
      state.timer = setInterval(async () => {
        try { const r = await github.sync(); if (r.changes.length) onChange && onChange(r); }
        catch (e) { onError && onError(e); }
      }, everyMs || 60000);
    },
    disconnect() { clearInterval(state.timer); state.gh = null; state.token = ''; },
    get data() { return state.gh; },
    tags: () => state.gh ? ghTags(state.gh) : null
  };

  /* ---------------- LinkedIn (PDF do perfil) ---------------- */
  const KW = {
    po: { Liderar: ['lead', 'líder', 'lider', 'head', 'manager', 'gestor', 'director', 'diretor', 'chefe'], Analisar: ['data', 'dados', 'analy', 'anális', 'analis', 'sql', 'python', 'excel', 'power bi', 'trading', 'research'], Construir: ['engineer', 'engenh', 'developer', 'software', 'build', 'react', 'javascript', 'typescript'], Ensinar: ['teach', 'tutor', 'explica', 'professor', 'formador', 'mentor'], Negociar: ['negoti', 'negoci', 'sales', 'vendas', 'trader', 'account'], Comunicar: ['communic', 'comunica', 'marketing', 'content', 'public speaking'], Criar: ['design', 'criativ', 'creative', 'ux', 'ui'], Organizar: ['operations', 'operações', 'project', 'projeto', 'planning', 'gestão'], Inovar: ['innovation', 'inovação', 'startup', 'founder', 'fundador', 'machine learning'], Cuidar: ['health', 'saúde', 'care', 'customer', 'cliente', 'people', 'rh'] },
    p: { Analítico: ['data', 'dados', 'analy', 'anális', 'engineer', 'engenh'], Curioso: ['research', 'investiga', 'science', 'ciência', 'bioqu'], Criativo: ['design', 'creative', 'criativ'], Ambicioso: ['founder', 'fundador', 'startup', 'trading'], Organizado: ['operations', 'project', 'gestão', 'management'] },
    c: { Compromisso: ['volunt', 'associa', 'member', 'membro'], Responsabilidade: ['manager', 'gestor', 'lead', 'líder'], Generosidade: ['volunt', 'mentor', 'tutor'], Integridade: ['audit', 'compliance', 'risk', 'risco'] }
  };
  function kwTags(txt) {
    txt = (txt || '').toLowerCase(); const out = {};
    for (const d in KW) { let best = null, bs = 0; for (const t in KW[d]) { const sc = KW[d][t].filter(k => txt.includes(k)).length; if (sc > bs) { bs = sc; best = t; } } out[d] = best; }
    out.p = out.p || 'Curioso'; out.po = out.po || 'Construir'; out.c = out.c || 'Compromisso';
    return out;
  }
  // pdf.js: usa window.pdfjsLib se já estiver na página; senão carrega do cdnjs.
  const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
  function loadPdfJs() {
    return new Promise((ok, ko) => {
      if (root.pdfjsLib) return ok(root.pdfjsLib);
      const s = document.createElement('script'); s.src = PDFJS + 'pdf.min.js';
      s.onload = () => { root.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + 'pdf.worker.min.js'; ok(root.pdfjsLib); };
      s.onerror = () => ko(new Error('Não consegui carregar o leitor de PDF (sem internet?)'));
      document.head.appendChild(s);
    });
  }
  async function parsePdf(file) {
    const lib = await loadPdfJs();
    const pdf = await lib.getDocument({ data: await file.arrayBuffer() }).promise; const lines = [];
    for (let i = 1; i <= Math.min(pdf.numPages, 4); i++) {
      const tc = await (await pdf.getPage(i)).getTextContent(); let cur = null;
      tc.items.forEach(it => { if (!it.str.trim()) return; const y = Math.round(it.transform[5]), h = Math.round(it.transform[0]);
        if (cur && Math.abs(cur.y - y) < 3) cur.s += ' ' + it.str; else { cur = { y, h, s: it.str, p: i }; lines.push(cur); } });
    }
    lines.forEach(l => l.s = l.s.replace(/\s+/g, ' ').trim());
    const HEAD = /^(contact|contactar|contacto|top skills|principais competências|languages|idiomas|certifications|certificações|summary|resumo|experience|experiência|education|formação acadêmica|formação académica|honors|publications)$/i;
    const p1 = lines.filter(l => l.p === 1), maxH = Math.max(...p1.map(l => l.h));
    const ni = lines.findIndex(l => l.p === 1 && l.h === maxH);
    const after = (re, n) => { const i = lines.findIndex(l => re.test(l.s)); if (i < 0) return []; const o = [];
      for (let k = i + 1; k < lines.length && o.length < n; k++) { if (HEAD.test(lines[k].s)) break; o.push(lines[k].s); } return o; };
    const name = ni >= 0 ? lines[ni].s : '', headline = ni >= 0 && lines[ni + 1] ? lines[ni + 1].s : '';
    const skills = after(/^(top skills|principais competências)$/i, 3);
    const exp = after(/^(experience|experiência)$/i, 6);
    const all = lines.map(l => l.s).join(' ');
    return { name, headline, skills, company: exp[0] || '', role: exp[1] || headline, exp, src: 'pdf',
      tags: kwTags(headline + ' ' + skills.join(' ') + ' ' + exp.join(' ') + ' ' + all.slice(0, 3000)) };
  }
  const linkedin = {
    /** Lê o PDF exportado do LinkedIn (File de um <input type=file>). */
    async fromPdf(file) { if (!file) throw new Error('Escolhe o PDF do perfil'); state.li = await parsePdf(file); return state.li; },
    /** Alternativa manual (sem PDF). */
    fromManual(role, company) { state.li = { name: '', headline: '', skills: [], company: company || '', role: role || '', exp: [], src: 'manual', tags: kwTags(role + ' ' + company) }; return state.li; },
    disconnect() { state.li = null; },
    get data() { return state.li; },
    tags: () => state.li ? state.li.tags : null
  };

  /* ---------------- Provas e MighTs automáticos ---------------- */
  function evidence() {
    const E = [], g = state.gh, l = state.li, pl = (n, a, b) => n + ' ' + (n === 1 ? a : b);
    if (g) {
      if (g.own) E.push({ d: 'po', tag: 'Construir', text: pl(g.own, 'projeto próprio publicado', 'projetos próprios publicados'), src: 'GitHub' });
      if (g.recent) E.push({ d: 'c', tag: 'Perseverança', text: pl(g.recent, 'projeto ativo', 'projetos ativos') + ' nos últimos 90 dias · ' + g.years + ' anos no GitHub', src: 'GitHub' });
      if (g.langs.length >= 3) E.push({ d: 'p', tag: 'Curioso', text: g.langs.length + ' linguagens: ' + g.langs.slice(0, 4).map(x => x[0]).join(', '), src: 'GitHub' });
      if (g.docs) E.push({ d: 'po', tag: 'Comunicar', text: pl(g.docs, 'projeto documentado', 'projetos documentados'), src: 'GitHub' });
      if (g.commits) E.push({ d: 'c', tag: 'Compromisso', text: g.commits + ' commits recentes' + (g.lastPush ? ' · último em ' + g.lastPush.repo : ''), src: 'GitHub' });
    }
    if (l) {
      if (l.role) E.push({ d: 'po', tag: l.tags.po, text: l.role + (l.company ? ' · ' + l.company : ''), src: 'LinkedIn' });
      if (l.skills.length) E.push({ d: 'p', tag: l.tags.p, text: 'Competências: ' + l.skills.join(', '), src: 'LinkedIn' });
    }
    return E;
  }
  function platformMighTs() {
    const out = [];
    if (state.gh) out.push({ src: 'github', from: 'GitHub (automático)', circle: 'Plataformas', ...ghTags(state.gh) });
    if (state.li) out.push({ src: 'linkedin', from: 'LinkedIn (automático)', circle: 'Plataformas', ...state.li.tags });
    return out;
  }

  root.MightConnect = { github, linkedin, evidence, platformMighTs, kwTags };
})(typeof window !== 'undefined' ? window : globalThis);

const MightConnect = (typeof window !== "undefined" ? window : globalThis).MightConnect;
export { MightConnect };
export default MightConnect;
