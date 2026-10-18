# Requirements and status

Statuses: **Pending** means not yet verified in the current implementation; **In progress** means some work exists but acceptance is incomplete; **Verified** requires recorded evidence. At scaffold creation, no gameplay or deployment acceptance is marked verified.

| ID | Requirement | Source | Phase | Status |
|---|---|---|---:|---|
| R-001 | Static TypeScript/Vite/Three.js app, no runtime backend/API/CDN, root custom-domain path | Explicit | 0 | Pending |
| R-002 | MIT license for original code; third-party asset licensing tracked separately | Explicit | 0 | Pending |
| R-003 | Public GitHub repo, `main`, CI, Pages deploy, issues/milestones | Explicit | 0 | In progress |
| R-004 | Installable landscape PWA with manifest, icons, standalone display, cached offline shell and assets | Explicit | 0, 6 | Pending |
| R-005 | Updates can download during play but activate safely outside active gameplay/boss fights | Explicit | 6 | Pending |
| R-006 | Meadow start, short integrated tutorial, human movement, jump, follow camera, star action | Explicit | 1 | Pending |
| R-007 | Rescue is triggered by landing atop a broad, low, forgiving cage | Explicit, Calvin | 1 | Pending |
| R-008 | Rescue opens cage, celebrates, gives clear feedback/effects, unlocks animal once | Explicit | 1 | Pending |
| R-009 | Rescued forms selectable at any time, reversible, permanent, distinct with an ability | Explicit | 1+ | Pending |
| R-010 | No death or game over; hazards and boss attacks safely return/bounce player | Explicit | 1 | Pending |
| R-011 | Connected bounded biomes, readable landmarks/routes, map/return/navigation hints | Explicit | 2 | Pending |
| R-012 | Winter includes Arctic fox | Explicit | 2 | Pending |
| R-013 | Savannah includes tiger, lion, giraffe, hippopotamus | Explicit | 2 | Pending |
| R-014 | Desert includes dunes, rocks, cacti, oasis, ruins, original surprises | Explicit + design completion | 2 | Pending |
| R-015 | Beach offers shallow-water/easy swimming introduction | Explicit | 2 | Pending |
| R-016 | Ocean/Atlantis includes shark, piranha, barracuda, whale shark, kraken, leviathan; easy 3D swim, no drowning | Explicit | 3 | Pending |
| R-017 | Original boy siren sings short jazz motif; no mermaids or copyrighted music | Explicit | 3 | Pending |
| R-018 | Lava, caves/Underground, Nether-inspired dimension and obvious return portal; hazards safe | Explicit | 3 | Pending |
| R-019 | City is explorable; includes rat, peregrine falcon, giant cow, original giant/reptile mechanical characters when needed | Explicit / rights-aware adaptation | 5 | Pending |
| R-020 | Authored wandering wildlife, hints and harmless nonviolent wobble interaction | Explicit | 2+ | Pending |
| R-021 | Required rescue registry excludes optional and ambient wildlife; visible remaining count | Explicit | 1+ | Pending |
| R-022 | Approximately 5–6 bosses, reusable encounters, brief skippable introductions/defeats | Explicit / approximate | 4–5 | Pending |
| R-023 | Baby giant-lizard concept and original comedic toilet monster with flush/spin defeat | Explicit concepts / rights-aware adaptation | 4 | Pending |
| R-024 | Final arena gated until every required rescue; final demon lizard, 5 head stomps and 3 visible hearts | Explicit, Calvin | 5 | Pending |
| R-025 | Finale celebration, animal “THANK YOU!”, short fanfare, boss once per save, continued exploration | Explicit | 5 | Pending |
| R-026 | Versioned local saves/migrations for rescues, forms, bosses, location, discoveries, settings; safe corruption behavior and confirmed reset | Explicit | 1, 5–6 | Pending |
| R-027 | Touch-first large controls, keyboard/pointer support, resize/cancel/safe-area handling | Explicit | 1, 6 | Pending |
| R-028 | Gentle original audio, browser activation handling, mute/volume, reduced motion where practical | Explicit / practical | 1, 6 | Pending |
| R-029 | Cohesive original art, packaged licensed assets, no ripped Minecraft/Pokémon/Godzilla/etc. content | Explicit | 1–6 | Pending |
| R-030 | Chromium and WebKit tests, meaningful gameplay/progression/persistence/PWA coverage; physical iPad claims only with device evidence | Explicit | 0–6 | Pending |
| R-031 | Performance target 30–60 FPS on modern iPad, progressive assets, bounded memory, responsive input | Explicit target | 1–6 | Pending |

## Proposed implementation details

The brief leaves the exact identities of two or three mini-bosses, several desert creatures, technical save format, and individual ability designs open. Those choices should remain original and child-friendly. These proposals do not expand the acceptance criteria unless adopted into the game design.

## Optional content

Optional world map expansion, fast travel, snowmen/igloos, hidden passages, replayable finale gallery, adaptive graphics, and extra wildlife are useful possibilities from the brief. They do not count as required rescues or block the final boss unless explicitly promoted to required content.

## Evidence log

Add links to CI runs, browser reports, release checks, or device notes here as requirements become verified. Do not treat a passing local build or a queued Pages job as proof of a live release.
