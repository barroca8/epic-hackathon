# Excel para afinidades

**Usar `work/diogo/profiles.xlsx`, folha `Participantes`.** Uma linha por ID do backend. `profiles.json` contém os mesmos perfis, indexados por ID, com listas e pesos estruturados.

- As seis primeiras colunas vêm de `GET participantes`. As novas colunas contêm as três palavras Self MighT, dados de formação/CV quando existirem, círculos e pesos do All MighT.
- `Pesos MighT` tem uma linha por pessoa/dimensão/tag: `contagem` e `peso = contagem / total na dimensão`. Conta cada `RECEIVED_TAG` uma vez, apenas de pares com reconhecimento aceite. `Ligações` conserva as ligações do endpoint.
- `all_personalidade`, `all_poder` e `all_caracter` são mapas JSON de IDs de tags para pesos 0–1. Não são percentagens de afinidade. Para calcular afinidades, usar esses pesos ou a folha `Pesos MighT`.
- Formação/interesses/CV permanecem vazios se não houver triplos correspondentes. `HAS_SKILL`, `HELD_ROLE`, `WORKED_AT` seguem o contrato; os outros campos têm o mapeamento explícito em `EXTRA_FIELDS`, ajustável ao backend.
- Atributos do seed mantêm o carácter simulado descrito no contrato de Francisco. Os nomes/grupos/contagens são lidos do backend; o exportador não inventa atributos.

Atualizar a partir da raiz do repositório:

```powershell
node work/diogo/export_profiles.mjs
```

Node.js 22+ e o runtime Codex instalado neste PC. Noutro ambiente Codex, definir `ARTIFACT_NODE_MODULES` para a pasta `node_modules` do runtime. A chave pública é lida do `work/francisco/graph.js`, ou de `SUPABASE_ANON_KEY`; não é copiada para novos ficheiros. Paginação em todos os endpoints. O script só faz GET no backend e recria os seus dois ficheiros locais.

Original de Francisco: `work/francisco/graph/might-graph.xlsx`. A versão enriquecida fica na pasta de Diogo para respeitar um escritor por ficheiro.

## Ler na demo live

Os mesmos perfis estão publicados em `triples`, com `predicate=PROFILE` e `source=diogo:profiles:v1`. Cada `object` é o JSON do perfil. Usar a chave pública do `graph.js` no header `apikey`.

```text
GET https://pkabsodqwruyccphfkud.supabase.co/rest/v1/triples?predicate=eq.PROFILE&source=eq.diogo%3Aprofiles%3Av1&order=id.desc
```

Fazer `JSON.parse(row.object)` e manter a primeira linha de cada `subject` (a versão mais recente). Esta é uma fotografia publicada dos perfis; para atualizar após novas respostas:

```powershell
node work/diogo/export_profiles.mjs
node work/diogo/publish_profiles.mjs
```

A publicação acrescenta apenas estados novos/alterados e verifica-os por GET. Não escreve `AFINIDADE` nem altera os triplos de origem.
