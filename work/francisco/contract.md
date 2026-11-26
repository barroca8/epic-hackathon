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

One Supabase table, read and written straight from the app with the JS client. No server.

```sql
create table triples (
  id bigint generated always as identity primary key,
  subject text not null,
  predicate text not null,
  object text not null,
  weight numeric default 1,
  circle text,
  source text,
  created_at timestamptz default now()
);
create index on triples (subject, predicate);
create index on triples (object, predicate);
```

Until the table exists, work against `work/francisco/triples.sample.json` (same shape, an array).
