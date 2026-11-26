const D=DATA,$=q=>document.querySelector(q)
const T=Object.fromEntries(D.tags.map(([id,n,d,l])=>[id,{id,n,d,l}]))
const DIMS=[['personality','Personalidade'],['power','Poder'],['character','Carácter']]
const CIRC=['Família','Amigos','Colegas','Escola','Comunidade','Clientes']
const FIGS=['a9','a1','a2','a3','a4','a5','a6','a7','a8','surf','pop-art','modrian','art-deco','hippie','matrioska','mystic-pink','retro-mandala','air-force','diogo-machado']
const fresh={v:'a',s:'welcome',h:[],name:'Leo',cv:'',links:{},self:{},art:'a9',sent:[],asked:0,box:[],dim:'all',q:'',circ:'Todos',who:0,fmt:'retrato',g:'net',set:'auto',ov:{},step:0,to:'',sc:'Amigos',st:{},gt:{},li:0}
let S={...fresh,...JSON.parse(localStorage.might||'{}')}
const esc=s=>String(s).replace(/[&<>"]/g,c=>`&#${c.charCodeAt(0)};`)
const ic=k=>{const set=S.ov[k]||(S.set==='auto'?{a:'lucide',b:'fill',c:'duotone'}[S.v]:S.set),o=ICONS[k]||{};return (o[set]||o.lucide||'<svg>').replace('<svg','<svg class="i"')}
const fig=(f=S.art,c='')=>`<img class="fig ${c}" src="assets/fig/${f}.webp" alt="Figura MighT">`
const btn=(t,go,i,c='')=>`<button class="btn ${c}" data-go="${go}">${i?ic(i):''}${t}</button>`
const act=(t,a,i,c='')=>`<button class="btn ${c}" data-act="${a}">${i?ic(i):''}${t}</button>`
const hdr=t=>`<div class="row"><button data-act="back">${ic('back')}</button><b class="g">${t}</b><button data-go="inbox">${ic('inbox')}${pend().length||''}</button></div>`
const chips=(list,cur,key)=>`<div class="chips">${list.map(([v,l])=>`<button class="chip ${cur===v?'on':''}" data-set="${key}" data-val="${v}">${l}</button>`).join('')}</div>`
const pills=ids=>`<div class="chips">${ids.filter(Boolean).map(i=>`<span class="chip">${T[i].n}</span>`).join('')}</div>`
const complete=o=>DIMS.every(([d])=>o[d])
const selects=key=>DIMS.map(([d,l])=>`<select data-tag="${key}.${d}"><option value="">${l}...</option>${D.tags.filter(t=>t[2]===d).map(t=>`<option value="${t[0]}" ${S[key][d]===t[0]?'selected':''}>${t[1]}</option>`).join('')}</select>`).join('')

function weights(list){const w={personality:{},power:{},character:{}},n={}
list.forEach(tags=>tags.forEach(t=>{const d=T[t]?.d;if(!d)return;w[d][t]=(w[d][t]||0)+1;n[d]=(n[d]||0)+1}))
for(const d in w)for(const t in w[d])w[d][t]/=n[d];return w}
const P=D.people.map(([name,group,self],i)=>{const got=D.mights.filter(m=>m[1]===i).map(m=>m[3]);return {i,name,group,w:weights(got.length?got:[self])}})
const ok=()=>S.box.filter(m=>m.st==='ok'),pend=()=>S.box.filter(m=>!m.st),unlocked=()=>ok().length>=3
const me=()=>weights(unlocked()?ok().map(m=>m.tags):[Object.values(S.self)])
const best=(w,d)=>Object.entries(w[d]).sort((a,b)=>b[1]-a[1])[0]?.[0]
const tops=w=>DIMS.map(([d])=>best(w,d)).filter(Boolean)
const sim=(a,b,dim='all')=>{const ds=dim==='all'?DIMS.map(d=>d[0]):[dim];return Math.round(100*ds.reduce((s,d)=>s+Object.keys(a[d]).reduce((x,t)=>x+Math.min(a[d][t],b[d][t]||0),0),0)/ds.length)}
const ranked=()=>{const w=me();return P.map(p=>({...p,pc:sim(w,p.w,S.dim)})).sort((a,b)=>b.pc-a.pc)}
const job=p=>D.roles[best(p.w,'power')]?.[0]||'A explorar'
const av=p=>`<span class="pct" style="display:flex;align-items:center;justify-content:center;background:hsl(${p.i*47%360} 45% 45%);color:#fff">${p.name.split(' ').map(x=>x[0]).slice(0,2).join('')}</span>`
const tagline=()=>{const t=tops(me());return t.length?T[t[0]].l+' · '+T[t[2]||t[0]].l:''}

const results=()=>{const q=S.q.toLowerCase(),r=ranked().filter(p=>(p.name+p.group+job(p)+tops(p.w).map(t=>T[t].n)).toLowerCase().includes(q)).slice(0,20)
const pc=p=>`<button class="pct" data-who="${p.i}">${p.pc}%</button>`
if(S.v==='b')return `<div class="two">${r.map(p=>`<div class="pn" style="align-items:center;text-align:center">${fig(FIGS[p.i%19],'sm')}<b>${p.name.split(' ').slice(0,2).join(' ')}</b>${pc(p)}${pills(tops(p.w))}</div>`).join('')}</div>`
if(S.v==='c')return r.map(p=>`<button class="pn" data-who="${p.i}"><span class="row"><b class="g">${p.name}</b><b>${p.pc}%</b></span><span class="bar"><i style="width:${p.pc}%"></i></span><small>${tops(p.w).map(t=>T[t].n).join(' · ')}</small></button>`).join('')
return r.map(p=>`<div class="pn"><div class="row">${av(p)}<div class="g"><b>${p.name}</b><small>${job(p)} · ${p.group}</small></div>${pc(p)}</div>${pills(tops(p.w))}</div>`).join('')}

const V={
welcome:()=>`<img src="assets/logo-${S.v==='c'?'black':'white'}.svg" style="height:60px;${S.v==='a'?'filter:invert(.9)':''}">${fig()}<h1>Descobre o que os outros veem em ti</h1><p>Visualiza o teu potencial e descobre novas funções e carreiras, com base em dados.</p>${btn('Entrar com LinkedIn (simulado)','cv','profile')}${btn('Entrar com Google','cv',0,'alt')}${btn('Entrar manualmente','cv',0,'alt')}`,
cv:()=>`${hdr('1 de 3')}<h1>Carrega o teu CV</h1><p>Usamos o CV para sugerir funções. É opcional.</p><label class="pn" style="align-items:center;padding:34px;border-style:dashed">${ic('upload')}<b>${S.cv?esc(S.cv):'Escolher ficheiro'}</b><input type="file" id="file" hidden></label>${S.cv?'<p>CV recebido. Leitura simulada nesta mock-up.</p>':''}${btn(S.cv?'Continuar':'Saltar','words','next')}`,
words:()=>{const head=`${hdr('2 de 3')}<h1>Escolhe 3 palavras</h1>`,done=`<button class="btn" data-go="links" ${complete(S.self)?'':'disabled'}>Continuar</button>`
const tagBtns=(d,c)=>D.tags.filter(t=>t[2]===d).map(t=>`<button class="${c} ${S.self[d]===t[0]?'on':''}" data-pick="${d}" data-val="${t[0]}">${t[1]}</button>`).join('')
if(S.v==='c')return `${head}<div style="font-size:27px;line-height:1.7">${[['Eu sou ','personality'],['O meu talento é ser ','power'],['Guio-me por ','character']].map(([l,d],i)=>`${l}<button data-set="step" data-num="${i}" style="color:var(--pr);font-weight:800;border-bottom:3px solid">${T[S.self[d]]?.n||'______'}</button>. `).join('')}</div><div class="chips">${tagBtns(DIMS[S.step][0],'chip')}</div>${done}`
const [d,l]=DIMS[S.step]
if(S.v==='b')return `${head}<div style="text-align:center">${fig(S.art,'sm')}</div>${pills(Object.values(S.self))}<div class="chips">${DIMS.map(([d,l],i)=>`<button class="chip ${S.step===i?'on':''}" data-set="step" data-num="${i}">${l}</button>`).join('')}</div><p>${T[S.self[d]]?.l||'Toca numa palavra'}</p><div class="chips">${tagBtns(d,'chip')}</div>${done}`
return `${head}<b>${l} (${S.step+1}/3)</b><div class="two">${tagBtns(d,'chip')}</div>${S.step<2?`<button class="btn" data-set="step" data-num="${S.step+1}" ${S.self[d]?'':'disabled'}>Seguinte</button>`:done}`},
links:()=>`${hdr('3 de 3')}<h1>Links opcionais</h1><input data-in="name" value="${esc(S.name)}" placeholder="Primeiro nome">${['LinkedIn','GitHub','Portfólio','Instagram'].map(k=>`<div class="row">${ic('link')}<input data-link="${k}" value="${esc(S.links[k]||'')}" placeholder="${k}"></div>`).join('')}${btn('Criar o meu MighT','mighty','sparkle')}`,
mighty:()=>`${hdr('O teu MighT')}<h1 style="text-align:center">${esc(S.name)}</h1>${fig()}${pills(Object.values(S.self))}<p>«${tagline()}»</p><b>Estilo do artista</b><div class="row" style="overflow:auto">${FIGS.map(f=>`<button data-set="art" data-val="${f}" style="${S.art===f?'outline:2px solid var(--pr);border-radius:10px':''}">${fig(f,'sm')}</button>`).join('')}</div><p>Boa! E agora, não queres descobrir o que os outros veem em ti? Começa por dar.</p>${btn('Mandar um MighT','send','send')}${btn('Ver o meu perfil','home','profile','alt')}`,
send:()=>`${hdr('Manda MighT')}<p>Reconhece as pessoas que te são mais próximas.</p><input data-in="to" list="pl" value="${esc(S.to)}" placeholder="Nome da pessoa"><datalist id="pl">${P.map(p=>`<option>${p.name}`).join('')}</datalist>${chips(CIRC.map(c=>[c,c]),S.sc,'sc')}${selects('st')}${act('Enviar MighT','send','send')}`,
ask:()=>{if(!S.sent.length)return `${hdr('Pede MighT')}<h1>${ic('lock')} Primeiro dá, depois pede</h1><p>Envia um MighT para desbloquear os pedidos.</p>${btn('Mandar um MighT','send','send')}`
return `${hdr('Pede MighT')}<p>Pede a quem te conhece melhor. Sem criar conta.</p><input data-in="to" list="pl" value="${esc(S.to)}" placeholder="Pedir por nome"><datalist id="pl">${P.map(p=>`<option>${p.name}`).join('')}</datalist>${act('Enviar pedido','ask','request')}${btn('QR code e link','share','qr','alt')}${btn('Caixa de MighTs','inbox','inbox','alt')}`},
share:()=>{const u=location.href.split('#')[0]+'#guest',q=qrcode(0,'M');q.addData(u);q.make();return `${hdr('Partilhar')}<div class="qr">${q.createSvgTag({scalable:true})}</div>${act('Copiar link de convite','copy','copy')}${btn('Partilhar por nome','ask','search','alt')}${btn('Abrir como convidado','guest','users','alt')}`},
guest:()=>`${hdr('Convite')}<h1>${esc(S.name)} pede-te um MighT</h1><p>Não precisas de conta.</p><input data-in="to" value="${esc(S.to)}" placeholder="O teu primeiro nome">${chips(CIRC.map(c=>[c,c]),S.sc,'sc')}${selects('gt')}${act('Enviar MighT','guest','send')}`,
inbox:()=>`${hdr('Caixa')}<p>${ok().length} de 3 MighTs aceites. Nada fica público sem o teu consentimento.</p>${S.box.map((m,i)=>`<div class="pn"><b>${esc(m.from)} · ${m.c}</b>${pills(m.tags)}${m.st?`<small>${m.st==='ok'?'Aceite':'Recusado'}</small>`:`<div class="row">${`<button class="btn" data-act="yes" data-i="${i}">${ic('check')}Aceitar</button><button class="btn alt" data-act="no" data-i="${i}">${ic('close')}Recusar</button>`}</div>`}</div>`).join('')}${act('Simular MighT recebido','sim','sparkle','alt')}${unlocked()?btn('Ver o meu All MighT','all','unlock'):''}`,
home:()=>{const w=me(),n=Math.min(ok().length,3),menu=[['about','Sobre','profile'],['all','All MighT','stats'],['card','O meu cartão','card'],['send','Mandar MighT','send'],['ask','Pedir MighT','request'],['search','Pesquisar pessoas','search'],['graph','Graph view','graph'],['roles','Funções ideais','roles'],['share','Partilhar','share']]
const list=`<div class="pn">${menu.map(([g,l,i])=>`<button class="row" data-go="${g}" style="padding:8px 0">${ic(i)}<span class="g" style="text-align:left">${l}</span>${ic('next')}</button>`).join('')}</div>`
if(S.v==='b')return `<h1>${esc(S.name)}</h1>${fig()}<b>${unlocked()?'All MighT desbloqueado':`Coleciona 3 MighTs (${n}/3)`}</b><div class="row">${[0,1,2].map(i=>`<button class="pn" data-go="inbox" style="height:80px;align-items:center;justify-content:center">${ic(i<n?'check':'lock')}<small>${i<n?esc(ok()[i].from.split(' ')[0]):'Vazio'}</small></button>`).join('')}</div>${btn(unlocked()?'Ver All MighT':'Pedir um MighT',unlocked()?'all':'ask',unlocked()?'unlock':'request')}${btn('Funções ideais','roles','roles','alt')}`
if(S.v==='c')return `<div class="row">${fig(S.art,'sm')}<div class="g"><h1>${esc(S.name)}</h1><small>${tagline()}</small></div><button data-go="about">${ic('edit')}</button></div><div class="bar"><i style="width:${n/3*100}%"></i></div><small>${n}/3 MighTs aceites</small>${DIMS.map(([d,l])=>`<div class="pn"><small>${l}</small>${Object.entries(w[d]).slice(0,3).map(([t,v])=>`<span class="row"><span style="width:110px">${T[t].n}</span><span class="bar g"><i style="width:${v*100}%"></i></span></span>`).join('')}</div>`).join('')}${list}`
return `<p style="text-align:center">Olá,</p><h1 style="text-align:center">${esc(S.name)}</h1>${btn('SEE ALL-MIGHT'.replace('SEE ALL-MIGHT','Ver All MighT'),'all',unlocked()?'unlock':'lock')}${fig()}${pills(tops(w))}${list}`},
about:()=>`${hdr('Sobre')}<input data-in="name" value="${esc(S.name)}">${['Bio','Experiência','Interesses','Desejo'].map(k=>`<input data-link="${k}" value="${esc(S.links[k]||'')}" placeholder="${k}">`).join('')}<div class="pn">${ic('file')} CV: ${esc(S.cv||'não carregado')}</div>${btn('Carregar CV','cv','upload','alt')}${btn('Editar links','links','link','alt')}${btn('Guardar','home','check')}`,
all:()=>{if(!unlocked())return `${hdr('All MighT')}<h1>${ic('lock')} Faltam ${3-ok().length} MighTs</h1><p>Agora é uma questão de tempo.</p>${btn('Pedir MighTs','ask','request')}${btn('Caixa de MighTs','inbox','inbox','alt')}`
const got=ok().filter(m=>S.circ==='Todos'||m.c===S.circ),w=weights(got.map(m=>m.tags)),self=Object.values(S.self),others=[...new Set(got.flatMap(m=>m.tags))],pc=t=>Math.round(100*w[T[t].d][t])
const grp=(l,ids,p)=>`<div class="pn"><b>${l}</b><div class="chips">${ids.map(t=>`<span class="chip">${T[t].n}${p?` ${pc(t)}%`:''}</span>`).join('')||'<small>Nada ainda</small>'}</div></div>`
return `${hdr('All MighT')}${chips(['Todos',...CIRC].map(c=>[c,c]),S.circ,'circ')}${fig('mystic-pink')}<div class="cloud chips" style="justify-content:center">${others.map(t=>`<span style="font-size:${13+pc(t)/4}px;font-weight:700">${T[t].n}</span>`).join('')}</div><h1>${self.length?Math.round(100*self.filter(t=>others.includes(t)).length/self.length):0}% confirmado</h1>${grp('Confirmado (Self e outros)',self.filter(t=>others.includes(t)),1)}${grp('Superpoderes secretos',others.filter(t=>!self.includes(t)),1)}${grp('Talentos escondidos',self.filter(t=>!others.includes(t)))}${btn('Criar MighT Card','card','card')}${btn('Pessoas como tu','search','search','alt')}`},
card:()=>unlocked()?`${hdr('O meu cartão')}${chips([['retrato','Retrato'],['linkedin','LinkedIn']],S.fmt,'fmt')}<img id="cimg" style="width:100%;border-radius:14px">${act('Descarregar PNG','dl','download')}${btn('Partilhar','share','share','alt')}${btn('Descobrir pessoas como tu','search','search','alt')}`:`${hdr('O meu cartão')}<h1>${ic('lock')} Cartão bloqueado</h1><p>Precisas de 3 MighTs aceites.</p>${btn('Caixa de MighTs','inbox','inbox')}`,
search:()=>`${hdr('Pessoas')}<div class="row">${ic('search')}<input data-in="q" value="${esc(S.q)}" placeholder="Nome, característica, função..."></div>${chips([['all','Tudo'],...DIMS],S.dim,'dim')}<div id="res" style="display:flex;flex-direction:column;gap:10px">${results()}</div>`,
person:()=>{const p=P[S.who],w=me(),mine=DIMS.flatMap(([d])=>Object.keys(w[d])),com=mine.filter(t=>p.w[T[t].d][t])
const diff=DIMS.flatMap(([d])=>Object.keys({...w[d],...p.w[d]})).map(t=>({t,v:(p.w[T[t].d][t]||0)-(w[T[t].d][t]||0)})).sort((a,b)=>Math.abs(b.v)-Math.abs(a.v))[0]
return `${hdr('Comparar')}${fig(FIGS[p.i%19])}<h1>${p.name}</h1><p>${job(p)} · ${p.group}</p><h1>${sim(w,p.w)}% de semelhança</h1>${DIMS.map(([d,l])=>`<small>${l} ${sim(w,p.w,d)}%</small><div class="bar"><i style="width:${sim(w,p.w,d)}%"></i></div>`).join('')}<b>Em comum</b>${com.length?pills(com):'<p>Ainda nada em comum.</p>'}<b>Maior diferença</b>${diff?`<p>${T[diff.t].n}: mais forte em ${diff.v>0?p.name.split(' ')[0]:'ti'}</p>`:''}${act('Mandar MighT','to','send')}${btn('Ver funções ideais','roles','roles','alt')}`},
graph:()=>{const mine=[...new Set([...S.sent.map(m=>m.to),...S.box.map(m=>m.from)])]
const list=S.g==='sim'?ranked().slice(0,14):mine.map((n,i)=>P.find(p=>p.name===n)||{i,name:n,pc:0,x:1})
const pos=list.map((p,i)=>{const a=i*6.283/list.length-1.57,r=S.g==='sim'?150-p.pc:115+(i%2)*30;return {...p,x:180+r*Math.cos(a),y:180+r*Math.sin(a)}})
return `${hdr('Graph view')}${chips([['net','As tuas conexões'],['sim','Parecidas contigo']],S.g,'g')}<svg viewBox="0 0 360 370" class="pn" style="padding:0">${pos.map(p=>`<line x1="180" y1="180" x2="${p.x}" y2="${p.y}" stroke="var(--pr)" opacity=".45"/>`).join('')}${pos.map(p=>`<g ${P[p.i]?.name===p.name?`data-who="${p.i}"`:''} style="cursor:pointer"><circle cx="${p.x}" cy="${p.y}" r="${S.g==='sim'?9+p.pc/6:13}" fill="hsl(${p.i*47%360} 55% 55%)"/><text x="${p.x}" y="${p.y+30}">${esc(p.name.split(' ')[0])}</text></g>`).join('')}<circle cx="180" cy="180" r="24" fill="var(--pr)"/><text x="180" y="220">Tu</text></svg>${list.length?'<p>Toca numa pessoa para comparar.</p>':`<p>Ainda não tens conexões.</p>${btn('Mandar um MighT','send','send')}`}`},
roles:()=>{const r=ranked().slice(0,12),w=me(),sc={};Object.entries(w.power).forEach(([t,v])=>sc[t]=v*3);r.forEach(p=>{const t=best(p.w,'power');if(t)sc[t]=(sc[t]||0)+p.pc/200})
const [a,b]=Object.keys(sc).filter(t=>D.roles[t]).sort((x,y)=>sc[y]-sc[x]);if(!a)return `${hdr('Funções ideais')}<p>Cria primeiro o teu MighT.</p>${btn('Escolher palavras','words','sparkle')}`
const like=t=>r.filter(p=>best(p.w,'power')===t).slice(0,2).map(p=>p.name.split(' ')[0]).join(' e ')
const steps=[['Agora',D.roles[a][0],a],['Próximo',D.roles[a][1],a],['Desafio',D.roles[b||a][1],b||a]].map(([k,role,t])=>({k,role,why:`Porque isto encaixa em ti: «${T[t].n}» faz parte do teu perfil${like(t)?` e ${like(t)}, com perfil parecido, também o têm`:''}.`}))
const card=s=>`<div class="pn"><small>${s.k} · hipótese</small><h1>${s.role}</h1><p>${s.why}</p></div>`
const body=S.v==='c'?chips(steps.map((s,i)=>[i,s.k]),S.li,'li').replace(/data-val/g,'data-num')+card(steps[S.li]):S.v==='b'?steps.map((s,i)=>`<div style="border-left:4px solid var(--pr);padding-left:14px;margin-left:${i*18}px">${card(s)}</div>`).join(''):steps.map(card).join('')
return `${hdr('Funções ideais')}${body}<p>São hipóteses para explorar, não uma avaliação.</p>${btn('Ver pessoas como tu','search','search')}${btn('Voltar ao perfil','home','home','alt')}`}}

const NAV={a:[['home','Início','home'],['search','Pessoas','search'],['inbox','Caixa','inbox'],['share','Partilhar','share']],b:[['home','Início','home'],['search','Pessoas','search'],['send','Mandar','send','fab'],['graph','Rede','graph'],['card','Cartão','card']],c:[['home','Perfil','profile'],['search','Pesquisar','search'],['graph','Grafo','graph'],['roles','Funções','roles'],['share','Partilhar','share']]}
function tools(){const sets=['auto','lucide','duotone','fill','material']
$('#as').innerHTML=`<b>Mock-up</b>${[['a','A · Original'],['b','B · Coleção'],['c','C · Editorial']].map(([v,l])=>`<button class="${S.v===v?'on':''}" data-set="v" data-val="${v}">${l}</button>`).join('')}<button data-act="demo">Preencher demo</button><button data-act="reset">Recomeçar</button><b>Ecrãs</b><div class="ir">${Object.keys(V).map(k=>`<button style="width:auto;padding:0 8px;font-size:11px" class="${S.s===k?'on':''}" data-go="${k}">${k}</button>`).join('')}</div><b>Ícones (conjunto)</b><div class="ir">${sets.map(s=>`<button style="width:auto;padding:0 8px;font-size:11px" class="${S.set===s?'on':''}" data-act="set" data-val="${s}">${s}</button>`).join('')}</div><button data-act="export">Copiar escolha de ícones</button><div class="ir">${Object.entries(ICONS).map(([k,o])=>`<b>${k}</b>${Object.keys(o).map(s=>`<button title="${s}" class="${S.ov[k]===s?'on':''}" data-icon="${k}" data-val="${s}">${o[s].replace('<svg','<svg class="i"')}</button>`).join('')}`).join('')}</div>`}
let last
function render(){localStorage.might=JSON.stringify(S);const sc=$('#sc'),y=sc.scrollTop,ay=$('#as').scrollTop;$('#ph').className=S.v;sc.innerHTML=V[S.s]();sc.scrollTop=last===S.s?y:0;last=S.s
$('#nv').innerHTML=['welcome','cv','words','links','guest'].includes(S.s)?'':NAV[S.v].map(([g,l,i,c])=>`<button class="${c||''} ${S.s===g?'on':''}" data-go="${g}">${ic(i)}${l}</button>`).join('');tools();$('#as').scrollTop=ay;if(S.s==='card'&&unlocked())draw()}
const go=s=>{if(s!==S.s)S.h.push(S.s);S.s=s;render()}
const toast=m=>{const t=document.createElement('div');t.textContent=m;t.style.cssText='position:fixed;top:14px;left:50%;transform:translateX(-50%);background:#000;color:#fff;padding:11px 16px;border-radius:10px;z-index:9;font-size:13px';document.body.append(t);setTimeout(()=>t.remove(),2200)}
const NAMES=['Joana','Duarte','Sofia','Mariana','Leandro','Inês','Vasco','Rita']
function incoming(){const n=S.box.length,self=Object.values(S.self),pool=[['curious','creator','collaboration'],['optimistic','connector','generosity'],['imaginative','creator','courage']][n%3];S.box.push({from:P.find(p=>p.name.startsWith(NAMES[n%8]))?.name||NAMES[n%8],c:CIRC[(n+1)%6],tags:pool.map((t,i)=>(n+i)%2&&self[i]?self[i]:t).filter(t=>T[t])})}
async function draw(){const wide=S.fmt==='linkedin',c=document.createElement('canvas'),W=c.width=wide?1200:1080,H=c.height=wide?627:1350,x=c.getContext('2d'),img=new Image();img.src=`assets/fig/${S.art}.webp`;await Promise.all([img.decode(),document.fonts.load('800 60px Mona')])
const g=x.createLinearGradient(0,0,0,H),col={a:['#2561c4','#102a55','#fff'],b:['#2a3770','#0f1428','#c8f000'],c:['#fbfaf7','#eeeae0','#1c1e28']}[S.v];g.addColorStop(0,col[0]);g.addColorStop(1,col[1]);x.fillStyle=g;x.fillRect(0,0,W,H)
const fh=wide?540:760,fw=fh*560/660;x.drawImage(img,wide?40:(W-fw)/2,wide?44:40,fw,fh);x.textAlign='center';const cx=wide?850:540,y=wide?150:890,mw=wide?620:960
const text=(t,dy,s,f=col[2])=>{x.fillStyle=f;x.font=`${s>40?800:500} ${s}px Mona`;x.fillText(t,cx,y+dy,mw)}
text(S.name,0,80);text(tops(me()).map(t=>T[t].n).join('  ·  '),80,36);DIMS.forEach(([d],i)=>{const t=best(me(),d);if(t)text('«'+T[t].l+'»',150+i*46,28)});text('Círculos: '+[...new Set(ok().map(m=>m.c))].join(', '),325,26);text('MighT · eu, pelos olhos dos outros',385,24)
const el=$('#cimg');if(el)el.src=c.toDataURL()}
document.addEventListener('click',e=>{const b=e.target.closest('[data-go],[data-act],[data-set],[data-pick],[data-who],[data-icon]');if(!b)return;const d=b.dataset
if(d.go){if(d.go==='words')S.step=0;return go(d.go)}
if(d.who){S.who=+d.who;return go('person')}
if(d.set){S[d.set]=d.num!==undefined?+d.num:d.val;return render()}
if(d.pick){S.self[d.pick]=d.val;if(S.v!=='a'&&S.step<2)S.step++;return render()}
if(d.icon){S.ov[d.icon]=d.val;return render()}
const a=d.act
if(a==='back'){S.s=S.h.pop()||'home'}
if(a==='set'){S.set=d.val;S.ov={}}
if(a==='export'){navigator.clipboard.writeText(JSON.stringify({set:S.set,icons:S.ov}));return toast('Escolha copiada')}
if(a==='reset'){S=structuredClone({...fresh,v:S.v,set:S.set,ov:S.ov})}
if(a==='demo'){S.self={personality:'curious',power:'creator',character:'collaboration'};S.sent=[{to:P[1].name}];S.box=[];for(let i=0;i<5;i++)incoming();S.box.slice(0,4).forEach(m=>m.st='ok');S.s='home'}
if(a==='send'||a==='guest'){const tags=a==='send'?S.st:S.gt;if(!S.to.trim()||!complete(tags))return toast('Indica o nome e as 3 palavras')
if(a==='send'){S.sent.push({to:S.to,c:S.sc,tags:Object.values(tags)});toast('MighT enviado. Vais ver que essa pessoa vai retribuir!');S.s='ask'}else{S.box.push({from:S.to,c:S.sc,tags:Object.values(tags)});S.s='inbox'}S.to='';S.st={};S.gt={}}
if(a==='ask'){if(!S.to.trim())return toast('Escreve um nome');toast('Pedido enviado a '+S.to);S.to='';setTimeout(()=>{incoming();toast('Recebeste um MighT');render()},2500)}
if(a==='sim')incoming()
if(a==='yes'||a==='no')S.box[d.i].st=a==='yes'?'ok':'no'
if(a==='copy'){navigator.clipboard.writeText(location.href.split('#')[0]+'#guest');return toast('Link copiado')}
if(a==='to'){S.to=P[S.who].name;return go('send')}
if(a==='dl'){const l=document.createElement('a');l.href=$('#cimg').src;l.download=`might-${S.fmt}.png`;l.click();return}
render()})
document.addEventListener('input',e=>{const t=e.target,d=t.dataset;if(d.in){S[d.in]=t.value;if(d.in==='q')$('#res').innerHTML=results()}if(d.link)S.links[d.link]=t.value;localStorage.might=JSON.stringify(S)})
document.addEventListener('change',e=>{const t=e.target;if(t.id==='file'&&t.files[0]){S.cv=t.files[0].name;render()}if(t.dataset.tag){const [k,d]=t.dataset.tag.split('.');S[k][d]=t.value;localStorage.might=JSON.stringify(S)}})
if(location.hash==='#guest')S.s='guest'
render()
