// Leonida Trophy Guide — offline tracker. No network: data is local, progress is localStorage.
const doc = await (await fetch('data/trophies.json')).json();
const TROPHIES = doc.trophies;
const POINTS = { platinum: 180, gold: 90, silver: 30, bronze: 15 };
const SOURCE_TEXT = doc.sources;
const KIND_LABEL = {
  platinum: 'Platinum', story: 'Story', mission: 'Mission', completion: 'Completion',
  driving: 'Driving', activity: 'Activity', strand: 'Stranger strand', challenges: 'Challenges',
  collectible: 'Collectible', partner: 'With your partner', combat: 'Combat', stealth: 'Stealth',
  heist: 'Heist', exploration: 'Exploration', misc: 'Moment', choices: 'Choices', economy: 'Economy',
};
const ROADMAP = [
  { title: '1 · Play the story', ids: [2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 7],
    text: 'Chapters 1–4 and the named missions, in order. Nothing here needs a perfect run — mission trophies pop on a finish. This pass also unlocks the map, the activities and the strangers, so everything after it gets easier.' },
  { title: '2 · Stranger strands', ids: [22, 23, 24, 26, 27, 25],
    text: 'Finish the final mission for Andy, Kenton, Billy, Randy and Tyrone — any 8 finished strands earns Strangers & Freaks. Work them between story missions; the stranger markers appear as you explore.' },
  { title: '3 · Activities & challenges', ids: [15, 16, 17, 18, 19, 20, 21, 28, 29, 32, 46],
    text: 'The leisure list: stunts, shooting range, drone races, races, fishing, arcade, meditation, hunting and bowling. Most of these count up while you play; the Shooting Range golds are the one true skill wall — leave them for a dedicated session.' },
  { title: '4 · Collectibles & exploration', ids: [30, 31, 35, 42],
    text: 'Cards, WAiNK It photo spots, 100 vehicles and all 52 areas of Leonida. Fold these into your driving — they are exploration trophies, and the map fills in as you go.' },
  { title: '5 · Heists, combat & money', ids: [36, 38, 39, 40, 41, 43, 51, 52, 53, 54, 55],
    text: 'Vaults, armored trucks, gang operations, Combat Focus and the economy trophies. Heist money feeds the $250,000 laundering and the 8 garages, so run these before the shopping spree.' },
  { title: '6 · Moments, partners & clean-up', ids: [33, 34, 37, 44, 45, 47, 48, 49, 50, 14, 1],
    text: 'The partner trophies and the odd moments — do them while the opportunity is in front of you (see Missables). Then 100% Completion, and the platinum is yours.' },
];

const EARNED_KEY = 'leonida-trophy-guide-earned-v1';
const SPOILER_KEY = 'leonida-trophy-guide-spoilers-v1';
const THEME_KEY = 'leonida-trophy-guide-theme-v1';
let earned = new Set(JSON.parse(localStorage.getItem(EARNED_KEY) ?? '[]'));
let spoilerOn = (localStorage.getItem(SPOILER_KEY) ?? 'on') === 'on';
let hideEarned = false;

const $ = (id) => document.getElementById(id);
const rowsEl = $('rows'), searchEl = $('search'), gradeEl = $('grade-filter'), kindEl = $('kind-filter');

function save() { localStorage.setItem(EARNED_KEY, JSON.stringify([...earned])); }
function totalPoints() { return TROPHIES.reduce((s, t) => s + (earned.has(t.name) ? POINTS[t.grade] : 0), 0); }
function maxPoints() { return TROPHIES.reduce((s, t) => s + POINTS[t.grade], 0); }
function byId(id) { return TROPHIES.find((t) => t.id === id); }
function isSpoiler(t) { return t.spoiler && spoilerOn && !earned.has(t.name); }

function renderProgress() {
  $('earned-count').textContent = earned.size;
  $('bar-fill').style.width = `${(earned.size / TROPHIES.length) * 100}%`;
  $('points-line').textContent = `${totalPoints()} of ${maxPoints()} points · ${Math.round((earned.size / TROPHIES.length) * 100)}% complete`;
  const chips = ['platinum', 'gold', 'silver', 'bronze'].map((g) => {
    const all = TROPHIES.filter((t) => t.grade === g).length;
    const got = TROPHIES.filter((t) => t.grade === g && earned.has(t.name)).length;
    return `<span><b>${got}/${all}</b> ${g}</span>`;
  }).join('');
  $('grade-chips').innerHTML = chips;
}

function medal(t) { return `<span class="medal ${t.grade}" title="${t.grade}">${t.grade === 'platinum' ? 'P' : t.grade[0].toUpperCase()}</span>`; }

function cardHTML(t) {
  const hidden = isSpoiler(t);
  const tags = [];
  if (t.kind !== t.grade) tags.push(`<span class="tag">${KIND_LABEL[t.kind] ?? t.kind}</span>`);
  tags.push(`<span class="tag">${t.grade}</span>`);
  if (t.missable) tags.push('<span class="tag warn">Watch out — may not come back</span>');
  return `<article class="card${earned.has(t.name) ? ' earned' : ''}${hidden ? ' spoiler-hidden' : ''}" data-id="${t.id}" tabindex="0">
    <input type="checkbox" class="t-check" ${earned.has(t.name) ? 'checked' : ''} aria-label="Earned: ${t.name}">
    ${medal(t)}
    <div class="card-body">
      <div class="t-name">${t.name}</div>
      <div class="t-desc">${t.description}</div>
      <div class="t-guide">${t.guide}</div>
      ${hidden ? '<div class="spoiler-note">Story trophy — hidden until earned. Turn spoilers off to reveal it.</div>' : ''}
      <div class="t-meta">${tags.join('')}</div>
    </div>
  </article>`;
}

function renderList() {
  const q = searchEl.value.trim().toLowerCase();
  const g = gradeEl.value, k = kindEl.value;
  const shown = TROPHIES.filter((t) => {
    if (g !== 'all' && t.grade !== g) return false;
    if (k !== 'all' && t.kind !== k) return false;
    if (hideEarned && earned.has(t.name)) return false;
    if (q && !(t.name + ' ' + t.description + ' ' + t.guide).toLowerCase().includes(q)) return false;
    return true;
  });
  rowsEl.innerHTML = shown.map(cardHTML).join('') || '<p class="summary">No trophies match these filters.</p>';
  $('list-summary').textContent = `Showing ${shown.length} of 55 trophies · ${earned.size} earned`;
}

function renderRoadmap() {
  $('roadmap-steps').innerHTML = ROADMAP.map((s) => {
    const items = s.ids.map((id) => {
      const t = byId(id);
      if (isSpoiler(t)) return `<li>Hidden story trophy <span style="color:var(--muted)">(${t.grade})</span></li>`;
      return `<li class="${earned.has(t.name) ? 'earned' : ''}">${t.name} <span style="color:var(--muted)">(${t.grade})</span></li>`;
    }).join('');
    const got = s.ids.filter((id) => earned.has(byId(id).name)).length;
    return `<div class="step"><h3>${s.title}</h3><p>${s.text}</p><p class="step-count">${got} of ${s.ids.length} done</p><ul>${items}</ul></div>`;
  }).join('');
}

function renderMissables() {
  const flagged = TROPHIES.filter((t) => t.missable);
  $('missable-rows').innerHTML = flagged.map(cardHTML).join('');
  $('missable-count').textContent = flagged.length;
}

function renderAll() { renderProgress(); renderList(); renderRoadmap(); renderMissables(); }

function toggleEarned(name) {
  if (earned.has(name)) earned.delete(name); else earned.add(name);
  save(); renderAll();
}

rowsEl.addEventListener('click', (e) => {
  const card = e.target.closest('.card');
  if (!card) return;
  const t = byId(Number(card.dataset.id));
  if (e.target.classList.contains('t-check')) { toggleEarned(t.name); return; }
  openDetail(t);
});
rowsEl.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const card = e.target.closest('.card');
  if (card) openDetail(byId(Number(card.dataset.id)));
});
$('missable-rows').addEventListener('click', (e) => {
  const card = e.target.closest('.card');
  if (!card) return;
  const t = byId(Number(card.dataset.id));
  if (e.target.classList.contains('t-check')) { toggleEarned(t.name); return; }
  openDetail(t);
});

function openDetail(t) {
  const hidden = isSpoiler(t);
  const srcs = t.sources.map((s) => `<li>${SOURCE_TEXT[s]}</li>`).join('');
  $('detail-body').innerHTML = `
    <h2>${hidden ? 'Hidden story trophy' : t.name}</h2>
    <p><span class="tag">${t.grade}</span> <span class="tag">${KIND_LABEL[t.kind] ?? t.kind}</span>${t.missable ? ' <span class="tag warn">Watch out — may not come back</span>' : ''}</p>
    ${hidden ? '<p>This story trophy is hidden until you earn it, or until you turn spoilers off.</p>' : `
    <p><strong>${t.description}</strong></p>
    <p>${t.guide}</p>
    <div class="sources"><strong>Sources</strong><ul>${srcs}</ul><p>${doc.guide_note}</p></div>`}
    <p><label><input type="checkbox" id="detail-earned" ${earned.has(t.name) ? 'checked' : ''}> Earned</label></p>`;
  $('detail').hidden = false;
  $('detail-earned').addEventListener('change', () => { toggleEarned(t.name); openDetail(t); });
}
$('detail-close').addEventListener('click', () => { $('detail').hidden = true; });
$('detail').addEventListener('click', (e) => { if (e.target.id === 'detail') $('detail').hidden = true; });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $('detail').hidden = true; });

// Tabs + hash routing (so a view can be linked and screenshotted directly).
function activate(view) {
  document.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === `view-${view}`));
  if (location.hash !== `#${view}`) history.replaceState(null, '', `#${view}`);
}
document.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => activate(b.dataset.view)));
window.addEventListener('hashchange', () => {
  const v = (location.hash || '').slice(1);
  if (['checklist', 'roadmap', 'missables', 'about'].includes(v)) activate(v);
});

// Controls.
for (const k of Object.keys(KIND_LABEL)) {
  const o = document.createElement('option');
  o.value = k; o.textContent = KIND_LABEL[k];
  kindEl.append(o);
}
searchEl.addEventListener('input', renderList);
gradeEl.addEventListener('change', renderList);
kindEl.addEventListener('change', renderList);
const spoilerToggle = $('spoiler-toggle');
spoilerToggle.checked = spoilerOn;
spoilerToggle.addEventListener('change', () => {
  spoilerOn = spoilerToggle.checked;
  localStorage.setItem(SPOILER_KEY, spoilerOn ? 'on' : 'off');
  renderList(); renderMissables();
});
$('hide-earned').addEventListener('change', (e) => { hideEarned = e.target.checked; renderList(); });
const themeBtn = $('theme-toggle');
function applyTheme() {
  const night = (localStorage.getItem(THEME_KEY) ?? 'paper') === 'night';
  document.documentElement.dataset.theme = night ? 'night' : 'paper';
  themeBtn.textContent = night ? 'Paper theme' : 'Night theme';
}
themeBtn.addEventListener('click', () => {
  const next = (localStorage.getItem(THEME_KEY) ?? 'paper') === 'night' ? 'paper' : 'night';
  localStorage.setItem(THEME_KEY, next);
  applyTheme();
});
$('export').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify({ game: 'Grand Theft Auto VI', earned: [...earned] }, null, 2)], { type: 'application/json' }));
  a.download = 'leonida-trophy-progress.json';
  a.click();
});
$('import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const names = Array.isArray(data) ? data : data.earned;
    earned = new Set(names.filter((n) => TROPHIES.some((t) => t.name === n)));
    save(); renderAll();
  } catch { alert('That file is not a Leonida Trophy Guide progress file.'); }
  e.target.value = '';
});
$('reset').addEventListener('click', () => {
  if (!confirm('Clear all earned trophies?')) return;
  earned = new Set(); save(); renderAll();
});

// URL overrides (used for screenshots): ?spoilers=off, ?view=roadmap|missables|about
const params = new URLSearchParams(location.search);
if (params.get('spoilers') === 'off') { spoilerOn = false; spoilerToggle.checked = false; }
applyTheme();
renderAll();
const initial = (location.hash || '').slice(1);
if (['checklist', 'roadmap', 'missables', 'about'].includes(initial)) activate(initial);
