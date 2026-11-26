# Perfis para o motor de afinidades

## Onde estão os dados

Repositório: [barroca8/epic-hackathon](https://github.com/barroca8/epic-hackathon). Fazer `git pull --rebase`.

- **Excel:** [work/diogo/profiles.xlsx](https://github.com/barroca8/epic-hackathon/blob/main/work/diogo/profiles.xlsx).
- **JSON:** [work/diogo/profiles.json](https://github.com/barroca8/epic-hackathon/blob/main/work/diogo/profiles.json), indexado pelo ID da pessoa.
- **Supabase:** os mesmos perfis estão na tabela `triples`, com `predicate = PROFILE` e `source = diogo:profiles:v1`.

Para a demo, os perfis podem ser lidos diretamente do Supabase. O Excel é a alternativa para trabalhar com uma tabela local.

## Ler os perfis no Supabase

```text
GET https://pkabsodqwruyccphfkud.supabase.co/rest/v1/triples?predicate=eq.PROFILE&source=eq.diogo%3Aprofiles%3Av1&order=id.desc
Header: apikey: <chave pública de work/francisco/graph.js>
```

Cada linha tem `subject` = ID da pessoa e `object` = perfil serializado em JSON. Fazer `JSON.parse(row.object)`.

A publicação é por versões: quando um perfil muda, é acrescentada uma linha. **Manter apenas a linha mais recente de cada `subject`.** O pedido acima já ordena do mais recente para o mais antigo.

Exemplo JavaScript, com paginação:

```js
async function carregarPerfis(apiKey) {
  const perfis = new Map();
  let offset = 0;

  while (true) {
    const url = new URL(
      'https://pkabsodqwruyccphfkud.supabase.co/rest/v1/triples'
    );
    url.search = new URLSearchParams({
      select: 'id,subject,object',
      predicate: 'eq.PROFILE',
      source: 'eq.diogo:profiles:v1',
      order: 'id.desc',
      limit: '500',
      offset: String(offset),
    }).toString();

    const resposta = await fetch(url, { headers: { apikey: apiKey } });
    if (!resposta.ok) throw new Error(`Supabase: HTTP ${resposta.status}`);
    const linhas = await resposta.json();
    if (!linhas.length) break;

    for (const linha of linhas) {
      if (!perfis.has(linha.subject)) {
        perfis.set(linha.subject, JSON.parse(linha.object));
      }
    }
    offset += linhas.length;
  }

  return [...perfis.values()];
}
```

## Campos a usar

| Campo do perfil JSON | Conteúdo |
|---|---|
| `id`, `nome`, `grupo` | Identificação; usar sempre `id` para associar pessoas |
| `self_tags` | IDs das palavras escolhidas pela pessoa |
| `self_might` | Essas palavras separadas em `personality`, `power`, `character` |
| `all_might` | Pesos das palavras recebidas, separados nas mesmas três dimensões |
| `mights_recebidos`, `mights_enviados`, `mights_aceites` | Contagens de reconhecimento |
| `circulos` | Círculos dos reconhecimentos aceites |
| `curso`, `instituicao`, `interesses`, `competencias`, `objetivos` | Listas preenchidas quando esses dados existem nos triplos |
| `funcoes`, `empresas`, `linkedin_url` | Informação adicional disponível no backend |

**`all_might` é a entrada preparada para comparar perfis.** Exemplo de formato:

```json
{
  "personality": { "tag:curious": 0.6, "tag:adaptable": 0.4 },
  "power": { "tag:solver": 1.0 },
  "character": { "tag:collaboration": 1.0 }
}
```

Os pesos são calculados como **contagem da palavra / total de palavras nessa dimensão**, usando apenas reconhecimentos aceites. Cada triplo `RECEIVED_TAG` é contado uma vez, evitando multiplicar tags quando o mesmo par de pessoas aparece em várias ligações.

Os valores estão entre 0 e 1 e somam 1 em cada dimensão com dados. São pesos de palavras; a afinidade entre duas pessoas será calculada pelo teu motor. Uma dimensão vazia (`{}`) significa ausência de dados.

Os campos adicionais sem informação ficam como listas vazias no JSON e células vazias no Excel. O exportador não infere interesses, competências ou formação. Os atributos simulados do seed mantêm essa natureza, conforme o contrato de Francisco.

## Como ler o Excel

- **`Participantes`:** uma linha por pessoa. As primeiras seis colunas correspondem ao endpoint `participantes`; as seguintes acrescentam palavras Self, campos do perfil e pesos.
- **`Pesos MighT`:** formato longo, uma linha por pessoa/dimensão/tag, com `id`, `nome`, `dimensao`, `tag_id`, `tag_pt`, `contagem`, `peso`. É a folha mais direta para calcular afinidades a partir do Excel. O peso é numérico; o Excel apenas o apresenta como percentagem.
- **`Ligações`:** ligações do endpoint `ligacoes`, com remetente, destinatário, círculo, tags e estado.

Na folha `Participantes`, `all_personalidade`, `all_poder` e `all_caracter` são mapas JSON de IDs de tags para pesos. Aplicar `JSON.parse` à célula quando estiver preenchida. Listas simples estão separadas por `;`.

## Atualizar os dados

**A publicação é uma fotografia dos dados no momento da execução. Novas respostas no backend não atualizam automaticamente o Excel nem os triplos `PROFILE`.** Para os atualizar, executar a partir da raiz do repositório:

```powershell
node work/diogo/export_profiles.mjs
node work/diogo/publish_profiles.mjs
```

1. O primeiro comando lê `participantes`, `ligacoes` e `triples`, com paginação, e recria `profiles.xlsx` e `profiles.json`.
2. O segundo publica apenas perfis novos ou alterados e confirma a publicação por GET. Repetir com os mesmos dados não acrescenta duplicados.
3. Voltar a executar `carregarPerfis()` na demo para ler os dados republicados. Para disponibilizar também o Excel atualizado no GitHub, fazer commit e push dos ficheiros gerados.

Requisitos do exportador: Node.js 22+ e a biblioteca de Excel do runtime Codex. Neste PC é detetada automaticamente; noutro ambiente, definir `ARTIFACT_NODE_MODULES` para a respetiva pasta `node_modules`. A chave pública é lida do `work/francisco/graph.js`; também pode ser fornecida em `SUPABASE_ANON_KEY`.

## Gravar o resultado das afinidades

O exportador prepara os perfis. Segundo o [contrato do grafo](https://github.com/barroca8/epic-hackathon/blob/main/work/francisco/contract.md), o teu motor grava as relações calculadas como triplos `AFINIDADE`, com os IDs das duas pessoas e `weight` na escala percentual definida nesse contrato.
