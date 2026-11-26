# Graph contract (v0, owner: Francisco)

Everyone writes and reads triples in this one shape. Change requests go to Francisco.

## Triple

Use `work/francisco/graph.js` (tested end to end against the live table):

```js
import * as graph from "./graph.js";
const me = await graph.createPerson("Ana", ["tag:curious", "tag:leader", "tag:courage"]); // step 1
const people = await graph.listPeople();                                                  // [{id, name}]
await graph.sendMight(me, people[0].id, "Amigos", ["tag:wise", "tag:planner", "tag:integrity"]); // step 2
await graph.answerMight(me, giverId, true);                                               // step 3
const p = await graph.getProfile(me, "Colegas"); // circle optional
// p = { name, self, pending:[{from,circle,tags}], received, unlocked (3 accepted), circles, allMight }
graph.onChange((row) => {});                     // live: fires on every new triple
```

"Pede MighT" (step 2B) needs no backend: share a link with `?give=<person id>`.

- IDs are `type:slug`, lowercase, no accents, hyphens for spaces: `person:ana-silva`, `tag:curiosa`.
- `weight`: number, default 1. `circle`: only on `GAVE_MIGHT`. `source`: `self`, `might`, `cv`, `seed`.

## Node types

`person` · `tag` · `skill` · `role` · `company` · `circle`

## Predicates

| Predicate | Subject → object | Written by |
|---|---|---|
| `NAME`, `GROUP` | person → text | App step 1, seed |
| `SELF_TAG` | person → tag | App, step 1 |
| `GAVE_MIGHT` | giver → receiver (`circle` set) | App, step 2 |
| `RECEIVED_TAG` | receiver → tag, one row per tag (`circle` set, `source` = giver id) | App, step 2 |
| `ACCEPTED_MIGHT`, `REFUSED_MIGHT` | receiver → giver | App, step 3 |
| `TAG_DIMENSION` | tag → `personality` / `power` / `character` | Seed |
| `HAS_SKILL` | person → skill | Vasco (CV) |
| `HELD_ROLE` | person → role | Vasco (CV) |
| `WORKED_AT` | person → company | Vasco (CV) |
| `TAG_SUGGESTS_ROLE` | tag → role | Seed |
| `AFINIDADE` | person → person (`weight` = % of overlapping tag weight) | Vasco, derived from the rows above |

## Storage

JSON files in git are the source of truth; everything else is derived and can be rebuilt.
`work/francisco/graph/`, built by `build_graph.py` from Epic's social graph (63 people, 1,110 MighTs):

| File | Holds |
|---|---|
| `tags.json` | 61 tags from Epic's word library: id, EN, PT, dimension |
| `people.json` | id, name, group, self tags |
| `mights.json` | from, to, circle, 3 tags, status |
| `profiles.json` | per person: MighTs received and All MighT weights per dimension (count / total) |
| `roles.json` | power tag -> role now, role next (hypotheses) |
| `triples.json` | all of the above as triples |

Real from Epic: people, groups, who sent to whom, the tag words. Simulated (seed 42): which tags each
MighT carries, circles, self tags, the tag-to-role table.

Afinidade (Vasco): read `profiles.json` or the table, write `AFINIDADE` triples.

## Live table (Supabase)

Table `triples`, same columns as the triple shape, loaded with `triples.json` (5,980 rows).
Anyone can read and insert; nobody can update or delete. Realtime is on.

```js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const db = createClient("https://pkabsodqwruyccphfkud.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrYWJzb2Rxd3J1eWNjcGhma3VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU2OTk2NjksImV4cCI6MjExMTI3NTY2OX0.bWNWAAkvEKvFO_ljnnOojdNjGOCZiu89z8Z3sabFwhk");
await db.from("triples").insert({ subject: "person:ana", predicate: "SELF_TAG", object: "tag:curious", source: "self" });
const { data } = await db.from("triples").select("*").eq("subject", "person:ana");
```

The key above is the public (anon) key and is safe in the app. New people and MighTs created in the
app are written here, not to the JSON files.

## Endpoints (plain HTTP, any language)

Base `https://pkabsodqwruyccphfkud.supabase.co/rest/v1/`, header `apikey: <public key from graph.js>`.

| Endpoint | Returns |
|---|---|
| `GET participantes?select=*` | Nodes: id, nome, grupo, self_tags, mights_recebidos, mights_enviados |
| `GET ligacoes?select=*&limit=2000` | Links: remetente, destinatario, circulo, tags, estado (aceite / recusado / pendente) |
| `GET triples?select=*&predicate=eq.AFINIDADE` | Raw triples, any filter (`subject=eq.…`) |
| `POST triples` (JSON body, add header `Content-Type: application/json`) | Insert one triple or an array |

Responses are capped at 1,000 rows unless `limit` is set. Excel copy of the two views:
`graph/might-graph.xlsx`, refreshed by `python export_xlsx.py`.

## Avatar endpoint

`POST https://pkabsodqwruyccphfkud.supabase.co/functions/v1/avatar` with `{"tags": [3 tag ids]}` or
`{"person": "<id>"}` (uses self tags). No key needed. In the app: `await graph.avatar(tags)`.

```json
{"head": {"tag": "tag:curious", "color": "#E88F3D", "pattern": "zigzag"},
 "body": {"tag": "tag:leader", "color": "#753065", "pattern": "solid"},
 "arms": {"tag": "tag:courage", "color": "#C87BCE", "pattern": "stripes"},
 "tagline": "…", "source": "groq"}
```

head = personality, body = power, arms = character. Colors come from the 11 brand colors. Patterns the
frontend must draw: `solid`, `stripes`, `dots`, `zigzag`, `grid`, `waves`, `checker`, `triangles`.
Groq picks them and writes the tagline; the result is cached, so the same 3 tags always look the same.
If Groq fails, a fixed rule answers (`source: "fallback"`).
