# Graph contract (v0, owner: Francisco)

Everyone writes and reads triples in this one shape. Change requests go to Francisco.

## Triple

```json
{
  "subject": "person:ana",
  "predicate": "HAS_SKILL",
  "object": "skill:python",
  "weight": 1,
  "circle": null,
  "source": "cv"
}
```

- IDs are `type:slug`, lowercase, no accents, hyphens for spaces: `person:ana-silva`, `tag:curiosa`.
- `weight`: number, default 1. `circle`: only on `GAVE_MIGHT`. `source`: `self`, `might`, `cv`, `seed`.

## Node types

`person` · `tag` · `skill` · `role` · `company` · `circle`

## Predicates

| Predicate | Subject → object | Written by |
|---|---|---|
| `SELF_TAG` | person → tag | App, step 1 |
| `GAVE_MIGHT` | person → person (`circle` set; the 3 tags go in as `RECEIVED_TAG`) | App, step 2 |
| `RECEIVED_TAG` | person → tag (`weight` = count) | App, step 2 |
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

Table `triples`, same columns as the triple shape, loaded with `triples.json` (2,427 rows).
Anyone can read and insert; nobody can update or delete. Realtime is on.

```js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const db = createClient("https://pkabsodqwruyccphfkud.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrYWJzb2Rxd3J1eWNjcGhma3VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU2OTk2NjksImV4cCI6MjExMTI3NTY2OX0.bWNWAAkvEKvFO_ljnnOojdNjGOCZiu89z8Z3sabFwhk");
await db.from("triples").insert({ subject: "person:ana", predicate: "SELF_TAG", object: "tag:curious", source: "self" });
const { data } = await db.from("triples").select("*").eq("subject", "person:ana");
```

The key above is the public (anon) key and is safe in the app. New people and MighTs created in the
app are written here, not to the JSON files.
