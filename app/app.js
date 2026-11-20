// Leonida Trophy Guide — offline checklist app.
//
// Loads app/data/trophies.json once, keeps earned trophies and the
// spoiler-guard setting in localStorage, and never reaches for the
// network. Views: checklist, roadmap, missables, spoiler guard.

const DATA_URL = "data/trophies.json";
const STORE_KEY = "gta6-trophy-guide-v2";

const state = {
  trophies: [],
  roadmap: [],
  earned: new Set(),
  revealed: new Set(),
  spoilerGuard: true,
  view: "checklist",
  search: "",
  grade: "all",
  kind: "all",
  missableOnly: false,
  hiddenOnly: false,
  earnedOnly: false,
};

function $(id) {
  return document.getElementById(id);
}

const listEl = $("trophy-list");

function loadStored() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (Array.isArray(saved.earned)) state.earned = new Set(saved.earned);
    if (Array.isArray(saved.revealed)) state.revealed = new Set(saved.revealed);
    if (typeof saved.spoilerGuard === "boolean") state.spoilerGuard = saved.spoilerGuard;
  } catch {
    // A corrupt save is not worth blocking the guide over; start fresh.
  }
}

function saveStored() {
  const payload = {
    earned: [...state.earned],
    revealed: [...state.revealed],
    spoilerGuard: state.spoilerGuard,
  };
  localStorage.setItem(STORE_KEY, JSON.stringify(payload));
}

function concealed(trophy) {
  return state.spoilerGuard && trophy.hidden && !state.earned.has(trophy.name) && !state.revealed.has(trophy.name);
}

function gradeMark(grade) {
  return { platinum: "◆", gold: "●", silver: "●", bronze: "●" }[grade] || "●";
}

function trophyMatches(trophy) {
  if (state.view === "missables" && !trophy.missable) return false;
  if (state.view === "spoilers" && !trophy.hidden) return false;
  if (state.grade !== "all" && trophy.grade !== state.grade) return false;
  if (state.kind !== "all" && trophy.kind !== state.kind) return false;
  if (state.missableOnly && !trophy.missable) return false;
  if (state.hiddenOnly && !trophy.hidden) return false;
  if (state.earnedOnly && !state.earned.has(trophy.name)) return false;
  if (state.search) {
    const hay = (trophy.name + " " + trophy.description + " " + (trophy.guide || "")).toLowerCase();
    if (!hay.includes(state.search.toLowerCase())) return false;
  }
  return true;
}

function renderProgress() {
  const total = state.trophies.length;
  const earned = state.earned.size;
  const pct = total ? Math.round((earned / total) * 100) : 0;
  $("progress-fill").style.width = pct + "%";
  $("progress-text").textContent = earned + " of " + total + " earned · " + pct + "%";
  const counts = {};
  for (const trophy of state.trophies) {
    counts[trophy.grade] = (counts[trophy.grade] || 0) + 1;
  }
  const earnedByGrade = {};
  for (const name of state.earned) {
    const trophy = state.trophies.find((t) => t.name === name);
    if (trophy) earnedByGrade[trophy.grade] = (earnedByGrade[trophy.grade] || 0) + 1;
  }
  $("grade-counts").textContent = ["platinum", "gold", "silver", "bronze"]
    .map((g) => gradeMark(g) + " " + g + " " + (earnedByGrade[g] || 0) + "/" + (counts[g] || 0))
    .join(" · ");
}

function renderRoadmap() {
  const list = $("roadmap-list");
  list.innerHTML = "";
  for (const stage of state.roadmap) {
    const inStage = state.trophies.filter((t) => t.stage === stage.stage);
    const done = inStage.filter((t) => state.earned.has(t.name)).length;
    const item = document.createElement("li");
    const heading = document.createElement("h3");
    heading.textContent = "Stage " + stage.stage + " — " + stage.title + " (" + done + "/" + inStage.length + ")";
    const text = document.createElement("p");
    text.textContent = stage.summary;
    item.append(heading, text);
    list.append(item);
  }
}

function tag(text, cls) {
  const el = document.createElement("span");
  el.className = "tag" + (cls ? " " + cls : "");
  el.textContent = text;
  return el;
}

function renderList() {
  listEl.innerHTML = "";
  const visible = state.trophies.filter(trophyMatches);
  $("list-count").textContent = "(" + visible.length + " shown)";
  $("empty-note").hidden = visible.length > 0;
  for (const trophy of visible) {
    const item = document.createElement("li");
    if (state.earned.has(trophy.name)) item.classList.add("earned");
    const box = document.createElement("input");
    box.type = "checkbox";
    box.className = "trophy-check";
    box.checked = state.earned.has(trophy.name);
    box.setAttribute("aria-label", "Mark " + trophy.name + " as earned");
    box.addEventListener("change", () => {
      if (box.checked) state.earned.add(trophy.name);
      else state.earned.delete(trophy.name);
      saveStored();
      renderAll();
    });
    const body = document.createElement("div");
    body.className = "trophy-body";
    const name = document.createElement("h3");
    name.className = "trophy-name";
    name.textContent = concealed(trophy) ? "Hidden trophy" : trophy.name;
    const desc = document.createElement("p");
    desc.className = "trophy-desc";
    desc.textContent = concealed(trophy)
      ? "Reveal this trophy to see its name and description."
      : trophy.description;
    const tags = document.createElement("div");
    tags.className = "tags";
    tags.append(tag(gradeMark(trophy.grade) + " " + trophy.grade, trophy.grade));
    tags.append(tag(trophy.kind));
    tags.append(tag("Stage " + trophy.stage));
    if (trophy.counter) tags.append(tag(trophy.counter.target + " " + trophy.counter.unit));
    if (trophy.hidden) tags.append(tag("Hidden", "hidden"));
    if (trophy.missable) tags.append(tag("Missable", "missable"));
    body.append(name, desc, tags);
    item.append(box, body);
    item.addEventListener("click", (event) => {
      if (event.target === box) return;
      openDetail(trophy);
    });
    listEl.append(item);
  }
}

function openDetail(trophy) {
  const panel = $("detail");
  const body = $("detail-body");
  body.innerHTML = "";
  const heading = document.createElement("h3");
  heading.textContent = concealed(trophy) ? "Hidden trophy" : trophy.name;
  body.append(heading);

  if (concealed(trophy)) {
    const note = document.createElement("p");
    note.textContent = "This trophy is hidden on PlayStation until you earn it. Reveal it to read its description and guide — or keep the surprise.";
    const reveal = document.createElement("button");
    reveal.type = "button";
    reveal.textContent = "Reveal this trophy";
    reveal.addEventListener("click", () => {
      state.revealed.add(trophy.name);
      saveStored();
      openDetail(trophy);
      renderList();
    });
    body.append(note, reveal);
    panel.hidden = false;
    return;
  }

  const desc = document.createElement("p");
  desc.textContent = trophy.description;
  body.append(desc);

  const tags = document.createElement("div");
  tags.className = "tags";
  tags.append(tag(gradeMark(trophy.grade) + " " + trophy.grade, trophy.grade));
  tags.append(tag(trophy.kind));
  tags.append(tag("Stage " + trophy.stage));
  if (trophy.hidden) tags.append(tag("Hidden", "hidden"));
  if (trophy.missable) tags.append(tag("Missable", "missable"));
  body.append(tags);

  if (trophy.counter) {
    const counter = document.createElement("p");
    counter.className = "counter-note";
    counter.textContent = "Target: " + trophy.counter.target + " " + trophy.counter.unit + " (" + trophy.counter.label + ")";
    body.append(counter);
  }
  if (trophy.missable && trophy.missable_note) {
    const warn = document.createElement("p");
    warn.className = "missable-note";
    warn.textContent = "Missable window: " + trophy.missable_note;
    body.append(warn);
  }

  const guideHeading = document.createElement("h4");
  guideHeading.textContent = "How to earn it";
  const guide = document.createElement("p");
  guide.textContent = trophy.guide;
  body.append(guideHeading, guide);

  const stepsHeading = document.createElement("h4");
  stepsHeading.textContent = "Steps";
  const steps = document.createElement("ol");
  for (const step of trophy.steps || []) {
    const li = document.createElement("li");
    li.textContent = step;
    steps.append(li);
  }
  body.append(stepsHeading, steps);

  const earnedBtn = document.createElement("button");
  earnedBtn.type = "button";
  earnedBtn.textContent = state.earned.has(trophy.name) ? "Mark as not earned" : "Mark as earned";
  earnedBtn.addEventListener("click", () => {
    if (state.earned.has(trophy.name)) state.earned.delete(trophy.name);
    else state.earned.add(trophy.name);
    saveStored();
    renderAll();
    openDetail(trophy);
  });
  body.append(earnedBtn);

  if (Array.isArray(trophy.sources) && trophy.sources.length) {
    const src = document.createElement("p");
    src.className = "sources";
    src.textContent = "Sources: ";
    trophy.sources.forEach((source, i) => {
      if (i > 0) src.append(document.createTextNode(" · "));
      const link = document.createElement("a");
      link.href = source.url;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = source.name;
      src.append(link);
    });
    body.append(src);
  }
  panel.hidden = false;
}

function closeDetail() {
  $("detail").hidden = true;
}

function renderAll() {
  renderProgress();
  renderRoadmap();
  renderList();
}

function applyView(view) {
  state.view = ["checklist", "roadmap", "missables", "spoilers"].includes(view) ? view : "checklist";
  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === state.view);
  });
  $("roadmap").hidden = state.view !== "roadmap";
  if (location.hash !== "#" + state.view) history.replaceState(null, "", "#" + state.view);
  renderList();
}

function exportProgress() {
  const blob = new Blob([JSON.stringify({ earned: [...state.earned], exported: new Date().toISOString() }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "gta6-trophy-progress.json";
  link.click();
  URL.revokeObjectURL(url);
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data.earned)) throw new Error("not a progress file");
      const known = new Set(state.trophies.map((t) => t.name));
      state.earned = new Set(data.earned.filter((name) => known.has(name)));
      saveStored();
      renderAll();
    } catch {
      alert("That file is not a trophy progress export from this guide.");
    }
  };
  reader.readAsText(file);
}

function wireControls() {
  $("search").addEventListener("input", (event) => {
    state.search = event.target.value;
    renderList();
  });
  $("filter-grade").addEventListener("change", (event) => {
    state.grade = event.target.value;
    renderList();
  });
  $("filter-kind").addEventListener("change", (event) => {
    state.kind = event.target.value;
    renderList();
  });
  $("filter-missable").addEventListener("change", (event) => {
    state.missableOnly = event.target.checked;
    renderList();
  });
  $("filter-hidden").addEventListener("change", (event) => {
    state.hiddenOnly = event.target.checked;
    renderList();
  });
  $("filter-earned").addEventListener("change", (event) => {
    state.earnedOnly = event.target.checked;
    renderList();
  });
  $("spoiler-guard").addEventListener("change", (event) => {
    state.spoilerGuard = event.target.checked;
    saveStored();
    renderList();
  });
  $("export-btn").addEventListener("click", exportProgress);
  $("import-btn").addEventListener("click", () => $("import-file").click());
  $("import-file").addEventListener("change", (event) => {
    if (event.target.files[0]) importProgress(event.target.files[0]);
    event.target.value = "";
  });
  $("reset-btn").addEventListener("click", () => {
    if (!confirm("Clear all earned trophies and revealed hidden trophies?")) return;
    state.earned = new Set();
    state.revealed = new Set();
    saveStored();
    renderAll();
  });
  $("detail-close").addEventListener("click", closeDetail);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeDetail();
  });
  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.addEventListener("click", () => applyView(btn.dataset.view));
  });
  window.addEventListener("hashchange", () => {
    applyView((location.hash || "#checklist").slice(1));
  });
}

async function init() {
  loadStored();
  $("spoiler-guard").checked = state.spoilerGuard;
  wireControls();
  const response = await fetch(DATA_URL);
  if (!response.ok) throw new Error("Could not load the trophy list.");
  const data = await response.json();
  state.trophies = data.trophies || [];
  state.roadmap = data.roadmap || [];
  renderAll();
  const view = (location.hash || "#checklist").slice(1);
  if (["roadmap", "missables", "spoilers"].includes(view)) {
    applyView(view);
  } else {
    document.querySelectorAll(".view-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === "checklist");
    });
  }
}

init().catch((err) => {
  listEl.innerHTML = "";
  const note = document.createElement("li");
  note.textContent = "The trophy list could not be loaded. Check that the app is served from its own folder and reload. (" + err.message + ")";
  listEl.append(note);
});
