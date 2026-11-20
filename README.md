# Leonida Trophy Guide — GTA 6 trophy tracker & guide

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/taufik52/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/taufik52/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

A web app that works fully offline and walks you through all **55
PlayStation 5 trophies** of Grand Theft Auto VI — 1 platinum, 2 gold,
6 silver, 46 bronze, 28 of them hidden.

## What you get

- **Checklist** — each trophy with its official name, description and
  grade. Your ticks live in the browser (localStorage), so progress
  survives a reload.
- **Filters** — narrow the list by kind (story, missable, collectibles,
  activities, side, combat, exploration, money, completion), by grade,
  or by typing any word into search.
- **Spoiler guard** — the names and descriptions of hidden story
  trophies stay covered until you have actually earned them.
- **Roadmap to the platinum** — five stages in playing order, worked
  out from the official trophy descriptions; every trophy card shows
  which stage it belongs to.
- **Missables** — the 14 trophies you can lock yourself out of are
  flagged and explained, so you can knock them out before the final
  mission.
- **Guides with sources** — each trophy gets a guide written here in
  this guide's own words, with steps and a running count for the ones
  that ask you to do something N times. Names, descriptions and grades
  cite Exophase and PSNProfiles. When the official description leaves
  a place or a step open, the guide says that plainly instead of
  making one up.
- **Export / import** — save your progress (and per-trophy notes) as a
  JSON file and load it back later.
- **Offline** — plain static files. Nothing is fetched from the
  network at runtime.

## Try it

Serve the `app/` folder with any static server, then open `index.html`:

```sh
npx serve app
# or
python3 -m http.server --directory app 8080
```

Deep links: `?view=roadmap`, `?view=missables`, `?open=<trophy id>`,
`?spoilers=off`, and `?demo=1` fills in sample progress (13 of 55
earned) so you can preview the tracker.

## Build the entry

`main.ts` (Node 22, standard library only) copies `app/` and
`screenshots/` into the output directory and writes `dossier.json`
using the kit's `buildDossier` from `vendor/makefun-frontend.ts`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Sources

- Trophy names, descriptions and grades: the official list, as shown
  by [Exophase](https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/)
  and [PSNProfiles](https://psnprofiles.com/trophies/43531-grand-theft-auto-vi).
- Guide text: written for this guide from the official descriptions.

## License

MIT. See `LICENSE`. Unofficial fan guide, not affiliated with or
endorsed by Rockstar Games; no Rockstar logo, artwork or game
screenshots are used.

---

<sub>Entered on [make.fun](https://make.fun/?ref=bvwh0bz2&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards. Bounty: [gta6-trophy-guide-01](https://make.fun/bounty/gta6-trophy-guide-01)</sub>
