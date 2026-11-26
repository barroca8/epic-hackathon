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
| `SIMILAR_TO` | person → person (`weight` = % overlap) | Diogo, derived from the rows above |

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

CV triples (Vasco): append to `work/vasco/triples.json` in the shape above. Similarity (Diogo): read
`profiles.json`, write `SIMILAR_TO`. A Supabase `triples` table with the same columns is only needed
if phones in the room must write live.
