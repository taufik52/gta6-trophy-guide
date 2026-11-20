# gta6-trophy-guide

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/taufik52/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/taufik52/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline trophy guide and tracker for Grand Theft Auto VI on PlayStation 5. It covers all 55 trophies — official names, descriptions and grades, a guide written in the author's own words for every single one, a five-stage roadmap to the platinum, and a checklist that remembers your progress in the browser. No account, no network, and no spoilers until you ask for them.

## Run it

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

That checks the trophy list end to end (55 trophies, 1 platinum / 2 gold / 6 silver / 46 bronze, 28 hidden, 14 missable), cross-checks `shots.json` against the files in `screenshots/`, and writes `out/dossier.json`. To actually use the guide, serve `app/` with any static server and open `index.html`, for example:

```sh
python3 -m http.server 8080 --directory app
```

---

Entered on [make.fun](https://make.fun/?ref=bvwh0bz2&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards

## The list at a glance

- **55 trophies:** 1 platinum, 2 gold, 6 silver, 46 bronze. Everything is single-player — there are no online trophies and no difficulty trophies.
- **28 hidden** on PlayStation until you earn them: the story trophies plus a set of side-activity surprises. The app's spoiler guard keeps them concealed until you reveal each one.
- **14 missables**, each flagged in the app together with the window that closes. The one that matters most is the Chapter 1 balcony meditation for Positive Mental Attitude — do it the morning after Down to Earth, before Chapter 1 ends. The rest are character strands that only open for one character or one chapter (Kenton, Andy, Billy, Tyrone, Randy, Bret, Cal, Yasmani), the Strangers & Freaks strands, the partner robberies, and the one-way Criminal Profile choices.
- **Platinum:** Vice Got a Price! — earn every other trophy. The hard part is the gold A Long Road (100% completion), roughly 200 hours all in.

## Roadmap to the platinum

1. **Play the story.** All five chapters with both characters. Keep a manual save at the start of every chapter; there is no mission replay. Never skip Lucia's balcony meditation in Chapter 1.
2. **Character quest lines.** Andy, Kenton, Billy, Randy, Tyrone, Bret, Cal, Moses and Yasmani, plus eight Strangers & Freaks strands. Take each strand when it appears — several are only offered for a while, and some belong to one character only.
3. **Activities and skills.** Races, Top Fun drone races, shooting ranges (42 gold medals), stunts (250 for the trophy, 300 for 100%), fishing, arcade games, sports and combat tricks.
4. **Collectibles and exploration.** 18 meditation spots, 100 WAiNK scans, 100 vehicles discovered, 3 card sets, 50 challenges, and the whole map of Leonida unfogged.
5. **100% checklist and clean-up.** After the credits, open Progress, Stats, 100% Completion and work it: every robbery, all 8 bank vaults, all 39 gang operations, underwater discoveries, all drone races and Bret's 15 Target Decks, then the partial counts. A Long Road — and the platinum — follow.

## Using the tracker

- **Checklist:** tick trophies off as you earn them; progress is saved in localStorage and survives reloads. Export it to a JSON file and import it back on another device.
- **Filters:** by grade, by kind (story, character quests, activities, collectibles, robberies, combat, money, exploration, completion, odd jobs), by missable, hidden or earned only, plus free-text search.
- **Spoiler guard:** on by default. Hidden trophies show as "Hidden trophy" with no name or description until you reveal one — or until you earn it. Turn the guard off any time.
- **Per-trophy guide:** click any trophy for its official description, the guide steps, its counter target where one exists, its missable window, and the sources each fact comes from.

## Sources

Trophy names, descriptions, grades and hidden flags follow the list as reported by Exophase and PSNProfiles, via Push Square's trophy guide and GTABase's full list; each trophy in `app/data/trophies.json` cites GTABase and Push Square beside its guide. Where the exact method is still unconfirmed (a handful of hidden trophies, marked in their guides), the guide says so rather than inventing steps. A few guides also cross-check Insider Gaming and Keengamer.

## Files

- `main.ts` — entrypoint: validates `app/data/trophies.json` and writes `dossier.json`.
- `app/index.html`, `app/app.js`, `app/style.css` — the offline tracker app.
- `app/data/trophies.json` — all 55 trophies: name, official description, grade, hidden/missable flags, kind, roadmap stage, counters, guide steps and sources.
- `screenshots/` — four screenshots of the app running (checklist, roadmap, missables, spoiler guard).
- `shots.json` — which view each screenshot shows.
- `vendor/makefun-frontend.ts` — the kit's dossier library, unchanged.
