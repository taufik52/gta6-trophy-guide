# Leonida Trophy Guide — GTA 6 trophy tracker & guide

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/taufik52/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/taufik52/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline web app that tracks and guides all **55 PlayStation 5 trophies**
of Grand Theft Auto VI (1 platinum, 2 gold, 6 silver, 46 bronze, 28 hidden).

## What it does

- **Checklist** — every trophy with its official name, description and grade,
  saved in the browser with localStorage. Tick a trophy when it pops.
- **Filters** — by kind (story, missable, collectibles, activities, side,
  combat, exploration, money, completion), by grade, and by free-text search.
- **Spoiler setting** — hides the names and descriptions of hidden story
  trophies until you earn them.
- **Roadmap to the platinum** — five stages in order, built from the official
  trophy descriptions, with each trophy's stage shown on its card.
- **Missables** — the 14 trophies whose moment can pass you by, flagged and
  explained, so you can clear them before the final mission.
- **Guides with sources** — every trophy has a guide in this guide's own
  words, with steps and a per-trophy counter for the counted ones, citing
  Exophase and PSNProfiles for its name, description and grade. Where the
  official description does not pin down a place or a step, the guide says
  so instead of inventing one.
- **Export / import** — download your progress as JSON and import it back;
  per-trophy notes are saved with it.
- **Offline** — static files only. The app loads nothing from the network.

## Try it

Serve `app/` with any static server and open `index.html`:

```sh
npx serve app
# or
python3 -m http.server --directory app 8080
```

Deep links: `?view=roadmap`, `?view=missables`, `?open=<trophy id>`,
`?spoilers=off`, and `?demo=1` seeds sample progress (13 of 55 earned)
for previewing the tracker.

## Build the entry

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/`
into the output directory and writes `dossier.json` with the kit's
`buildDossier` from `vendor/makefun-frontend.ts`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Sources

- Trophy names, descriptions and grades: the official list, as listed by
  [Exophase](https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/)
  and [PSNProfiles](https://psnprofiles.com/trophies/43531-grand-theft-auto-vi).
- Guide text: written for this guide from the official descriptions.

## License

MIT. See `LICENSE`. Unofficial fan guide, not affiliated with or endorsed
by Rockstar Games; no Rockstar logo, artwork or game screenshots are used.

---

<sub>Entered on [make.fun](https://make.fun/?ref=bvwh0bz2&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards. Bounty: [gta6-trophy-guide-01](https://make.fun/bounty/gta6-trophy-guide-01)</sub>
