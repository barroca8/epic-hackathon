# MighT front end (reference to copy)

For the agent connecting this to a backend. Copy the folder, do not edit it in place.

```
npm install
npm run dev      # http://localhost:1002
```

## Where to change things

| To change | Edit |
|---|---|
| Backend | `src/api/` only |
| Colors, radius, font | `src/theme.css` |
| Unlock count, circles, nav, providers | `src/config.js` |
| Icons | `src/components/icons.jsx` |
| Screens and copy (pt-PT) | `src/screens/` (onboarding, mights, profile, discover) |
| Similarity, weights, roles | `src/lib/matching.js` |
| Figure choice | `src/lib/avatar.js` |
| Figure drawing, card PNG | `src/lib/figure.js`, `src/lib/card.js` |

Routes are in `src/App.jsx`. Shared state is `useStore()` from `src/store.jsx`; screens never read storage or fetch directly.

## Connect the backend

1. Create `src/api/live.js` exporting an object with the methods listed in `src/api/index.js`.
2. In `src/api/index.js` set `const adapter = live`. Leave out `demo` and the demo button disappears.

Mapping to `work/francisco/graph.js` and `contract.md`:

| Adapter | Backend |
|---|---|
| `createPerson`, `sendMight`, `answerMight`, `getProfile` | same names and shapes in `graph.js` |
| `onChange` | `graph.onChange`; return an unsubscribe function |
| `listPeople` | `GET participantes`: `nome` → `name`, `grupo` → `group`, `self_tags` → `selfTags` |
| `listLinks` | `GET ligacoes?limit=2000`: `remetente`, `destinatario`, `circulo`, `estado` aceite / recusado / pendente → accepted / refused / pending. Page past 1,000 rows |
| `avatar(tags)` | `graph.avatar(tags)`; it ignores `signals` and returns no `art`, so the app draws the colors and patterns |
| `requestMight` | no backend call: share `?give=<person id>` |
| `parseCv`, `connectAccount` | not built yet; keep the mock versions |

- Keep the artwork figures with the live avatar: return `{ ...await graph.avatar(tags), art: pickAvatar(tags, signals).art }`.
- The live table is public and rows cannot be deleted. Do not test with real personal data.
- `@handles` are derived from names in `src/lib/handle.js`. Store them server side if they must stay stable.

## Simulated in this version

Login, CV reading, account connection, replies from other people, role suggestions. Data lives in `localStorage`,
so a QR or invite link only works in the same browser until the backend is connected (and the app is hosted on
an address phones can reach). `src/data/` is a snapshot of `work/francisco/graph/`.
