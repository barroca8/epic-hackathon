// The only file the screens import data from. Swap `adapter` to connect a real backend.
// Every method is async. Ids look like "person:slug" and "tag:slug".
//
// createPerson(name, selfTags[])            -> personId
// listPeople()                              -> [{ id, name, group, selfTags, handle? }]   handle ("@ana_silva") is derived if missing
// listLinks()                               -> [{ from, to, circle, tags, status }]   status: accepted | refused | pending
// sendMight(from, to, circle, tags[])       -> void
// requestMight(from, to)                    -> void
// answerMight(person, from, accept)         -> void
// getProfile(id, circle = null)             -> { id, name, self, pending: [{ from, circle, tags }], received,
//                                               unlocked, circles, allMight: { personality, power, character } }
// parseCv(file)                             -> { fileName, role, skills[] }
// connectAccount(provider)                  -> { provider, title, lines[], role?, skills[] }
// avatar(tags[], signals[])                 -> { head, body, arms: { tag, color, pattern }, tagline, source, art?, reason? }
// onChange(callback)                        -> unsubscribe()
// demo (optional)                           -> { fill(), receive(personId), reset() }

import { mock } from './mock.js'

const adapter = mock

export const api = adapter
