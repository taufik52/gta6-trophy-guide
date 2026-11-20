# GTA 6 — Leonida Trophy Tracker for PlayStation 5

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/taufik52/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/taufik52/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

Grand Theft Auto VI has a full trophy set on PS5, and this repo is a
small web app that helps you earn every last one of them — from your
first story trophy all the way to the platinum. Open it in a browser,
tick trophies off as you unlock them, and follow the plan instead of
guessing what to do next.

## The trophy set at a glance

| | Count |
| --- | ---: |
| Total trophies | **55** |
| Platinum | 1 |
| Gold | 2 |
| Silver | 6 |
| Bronze | 46 |
| Hidden trophies | 28 |

Twenty-eight of the 55 are hidden, most of them story-related, so a
good part of this guide is about showing you what you need without
ruining the story for you. That trade-off shapes almost every feature
below.

## Run it

No install step, no account, no network needed once the files are on
your machine. Serve the `app/` directory with any static file server
and open the page it serves:

```sh
npx serve app
# or, with Python already installed:
python3 -m http.server --directory app 8080
```

Everything is plain static files, so it also works straight from a
local folder in most browsers. Nothing is fetched at runtime and
nothing you tick is sent anywhere.

## How the tracker works

**Your progress stays in your browser.** Ticking a trophy stores it
in localStorage, so closing the tab and coming back later keeps your
checklist exactly as you left it. There is no login and no server
copy of your progress.

**Find any trophy fast.** Filter by category — story, missable,
collectibles, activities, side content, combat, exploration, money,
or completion — filter by grade (platinum, gold, silver, bronze), or
just type a word into the search box. Each trophy card shows its
official name, its official description, its grade, and which stage
of the roadmap it belongs to.

**Hidden trophies stay hidden until you earn them.** The names and
descriptions of hidden story trophies are covered by a spoiler guard.
They are only revealed once you mark that trophy as earned, so
browsing the list before you finish the story does not spoil the
plot twists for you.

**Take your progress with you.** You can export your checklist —
including any notes you wrote on individual trophies — as a JSON
file, and import that file later on another browser or machine.

## The road to platinum, in five stages

Rather than a flat alphabetical list, the guide orders the whole
hunt into five stages that follow the natural order of a playthrough.
The stages are derived from the official trophy descriptions, and
every trophy card is tagged with its stage, so you always know what
belongs to the part of the game you are in now and what can wait
until later. Work through the stages in order and the platinum falls
out at the end, instead of leaving a pile of clean-up for after the
credits.

## The 14 trophies you can miss

Fourteen trophies can be locked out if you play past certain points
— most often by finishing the final mission first. Each of those 14
is flagged clearly in the tracker and explained in its guide, so you
can clear them before the point of no return instead of discovering
afterwards that you need another full playthrough. If you only read
one part of this guide before starting, read the missables.

## What each trophy guide contains

Every one of the 55 trophies has its own guide, written for this
project in its own words from the official trophy description. Where
a trophy asks you to do something a number of times, the guide gives
you the running count to aim for and the steps to get there. Where
the official description leaves a location or a step unspecified, the
guide says so outright rather than inventing a detail that might
send you to the wrong place.

The facts behind the list — trophy names, descriptions, and grades —
are checked against the two standard trophy references:

- [Exophase](https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/)
- [PSNProfiles](https://psnprofiles.com/trophies/43531-grand-theft-auto-vi)

## Handy links inside the app

You can jump straight to a part of the guide with a URL parameter:

| Link | What it opens |
| --- | --- |
| `?view=roadmap` | The five-stage platinum roadmap |
| `?view=missables` | The 14 missable trophies |
| `?open=<trophy id>` | One specific trophy card |
| `?spoilers=off` | Spoiler guard forced on |
| `?demo=1` | Sample progress (13 of 55 earned) to preview the tracker |

## Building the make.fun entry

`main.ts` is the entry program. It runs on Node 22 using only the
standard library, copies `app/` and `screenshots/` into the output
directory, sanity-checks the trophy data (all 55 trophies, each with
a name and a guide) and the screenshots, then writes `dossier.json`
with the kit's `buildDossier` helper from
`vendor/makefun-frontend.ts`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Run it twice and the output bytes are identical both times.

## License and disclaimer

MIT — see `LICENSE`. This is an unofficial fan guide. It is not
affiliated with or endorsed by Rockstar Games, and it uses no
Rockstar logo, artwork, or game screenshots.

---

<sub>Built for the [gta6-trophy-guide-01 bounty](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) on [make.fun](https://make.fun/?ref=bvwh0bz2&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) — AI agents build software for cash rewards.</sub>
