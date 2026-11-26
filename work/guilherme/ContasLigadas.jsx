// MighT · Contas ligadas (GitHub + LinkedIn) — componente React
// Uso: <ContasLigadas onUpdate={({evidence, mights, changes}) => ...} />
import { useEffect, useState } from 'react';
import MightConnect from './mightConnections';

const COR = { p: '#e88f3d', po: '#0b5aa9', c: '#753066' };
const Tag = ({ d, children }) => (
  <span style={{ background: COR[d], color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 700, marginRight: 4 }}>{children}</span>
);
const btn = (bg) => ({ background: bg, color: '#fff', border: 0, borderRadius: 99, padding: '8px 14px', fontWeight: 700, cursor: 'pointer' });
const input = { width: '100%', boxSizing: 'border-box', border: '1.5px solid #e4e2dd', borderRadius: 10, padding: 10, fontSize: 16, marginTop: 8 };

export default function ContasLigadas({ onUpdate, syncEveryMs = 60000 }) {
  const [gh, setGh] = useState(null);
  const [li, setLi] = useState(null);
  const [user, setUser] = useState('');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState('');
  const [log, setLog] = useState([]);

  const push = (t) => setLog((l) => [`${new Date().toLocaleTimeString()} · ${t}`, ...l].slice(0, 8));
  const emit = (changes = []) => {
    setGh(MightConnect.github.data ? { ...MightConnect.github.data } : null);
    setLi(MightConnect.linkedin.data ? { ...MightConnect.linkedin.data } : null);
    onUpdate && onUpdate({ evidence: MightConnect.evidence(), mights: MightConnect.platformMighTs(), changes });
  };

  useEffect(() => () => MightConnect.github.disconnect(), []); // pára a sincronização ao sair

  async function ligarGitHub() {
    setBusy('gh');
    try {
      const g = await MightConnect.github.connect(user, token);
      setToken(''); // o token não fica no estado do React
      push(`GitHub ligado: ${g.own} projetos próprios`);
      MightConnect.github.autoSync(syncEveryMs, (r) => { push('🔄 MighT atualizado: ' + r.changes.join(' · ')); emit(r.changes); },
        (e) => push('Erro na sincronização: ' + e.message));
      emit();
    } catch (e) { push('Erro: ' + e.message); }
    setBusy('');
  }
  async function sincronizar() {
    try { const r = await MightConnect.github.sync(); push(r.changes.length ? '🔄 ' + r.changes.join(' · ') : 'Já está tudo atualizado'); emit(r.changes); }
    catch (e) { push('Erro: ' + e.message); }
  }
  async function ligarLinkedIn(file) {
    setBusy('li');
    try { const l = await MightConnect.linkedin.fromPdf(file); push(`LinkedIn ligado: ${l.role}${l.skills.length ? ' · ' + l.skills.join(', ') : ''}`); emit(); }
    catch (e) { push('Erro: ' + e.message); }
    setBusy('');
  }
  function desligar(k) {
    if (k === 'gh') MightConnect.github.disconnect(); else MightConnect.linkedin.disconnect();
    push((k === 'gh' ? 'GitHub' : 'LinkedIn') + ' desligado. Dados apagados.'); emit();
  }

  const evidence = MightConnect.evidence();
  return (
    <div style={{ background: '#fff', border: '1px solid #e4e2dd', borderRadius: 14, padding: 16 }}>
      <h3 style={{ margin: 0 }}>Contas ligadas</h3>
      <p style={{ color: '#6b6f7a', fontSize: 13.5 }}>Junta provas ao teu MighT. Guardamos só o resumo; o token fica apenas em memória.</p>

      {/* GitHub */}
      <div style={{ borderTop: '1px solid #eee', paddingTop: 10 }}>
        <b>GitHub</b>{gh && <span style={{ color: '#3d9062', fontSize: 12, fontWeight: 700 }}> ● ligado</span>}
        {gh ? (
          <>
            <div style={{ color: '#6b6f7a', fontSize: 13 }}>
              @{gh.user} · {gh.repos} repositórios{gh.auth ? ` (${gh.priv} privados)` : ' públicos'} · {gh.langs.slice(0, 3).map((x) => x[0]).join(', ')}
            </div>
            <button style={btn('#1c1f28')} onClick={sincronizar}>🔄 Sincronizar</button>{' '}
            <button style={{ ...btn('#eef0f3'), color: '#1c1f28' }} onClick={() => desligar('gh')}>Desligar</button>
          </>
        ) : (
          <>
            <input style={input} placeholder="Utilizador do GitHub" value={user} onChange={(e) => setUser(e.target.value)} />
            <input style={input} type="password" autoComplete="off" placeholder="Token só de leitura (opcional, repositórios privados)" value={token} onChange={(e) => setToken(e.target.value)} />
            <button style={{ ...btn('#1c1f28'), width: '100%', marginTop: 8 }} disabled={busy === 'gh'} onClick={ligarGitHub}>{busy === 'gh' ? 'A ligar…' : 'Ligar GitHub'}</button>
          </>
        )}
      </div>

      {/* LinkedIn */}
      <div style={{ borderTop: '1px solid #eee', paddingTop: 10, marginTop: 12 }}>
        <b>LinkedIn</b>{li && <span style={{ color: '#3d9062', fontSize: 12, fontWeight: 700 }}> ● ligado</span>}
        {li ? (
          <>
            <div style={{ color: '#6b6f7a', fontSize: 13 }}>{li.role}{li.company ? ' · ' + li.company : ''}</div>
            <button style={{ ...btn('#eef0f3'), color: '#1c1f28' }} onClick={() => desligar('li')}>Desligar</button>
          </>
        ) : (
          <>
            <div style={{ color: '#6b6f7a', fontSize: 13 }}>No LinkedIn: Perfil → Mais → Guardar em PDF</div>
            <label style={{ ...btn('#0a66c2'), display: 'block', textAlign: 'center', marginTop: 8 }}>
              {busy === 'li' ? 'A ler…' : '📄 Escolher o PDF do perfil'}
              <input type="file" accept="application/pdf" hidden onChange={(e) => ligarLinkedIn(e.target.files[0])} />
            </label>
          </>
        )}
      </div>

      {/* Provas */}
      {evidence.length > 0 && (
        <div style={{ borderTop: '1px solid #eee', paddingTop: 10, marginTop: 12 }}>
          <b>Provas para as tuas tags</b>
          {evidence.map((e, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 0', fontSize: 13.5 }}>
              <Tag d={e.d}>{e.tag}</Tag><span style={{ flex: 1 }}>{e.text}</span><span style={{ color: '#6b6f7a', fontSize: 11 }}>{e.src}</span>
            </div>
          ))}
        </div>
      )}

      {log.length > 0 && (
        <div style={{ borderTop: '1px solid #eee', paddingTop: 10, marginTop: 12, fontSize: 12.5, color: '#6b6f7a' }}>
          {log.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}
    </div>
  );
}
