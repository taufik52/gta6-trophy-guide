"use strict";

/* Leonida Trophy Guide — offline tracker.
   Loads the trophy list from the app's own data file, keeps progress in
   localStorage, and never reaches for the network. */

const DATA_URL = "./data/trophies.json";
const STORE_KEY = "gta6-trophy-guide-v4";

const state = {
  trophies: [],
  roadmap: [],
  earned: new Set(),
  revealed: new Set(),
  spoilerGuard: true,
  query: "",
  grade: "all",
  kind: "all",
  missableOnly: false,
  hiddenOnly: false,
  earnedOnly: false,
  selected: null,
};

const $ = (id) => document.getElementById(id);
const listEl = $("trophy-list");
const detailEl = $("detail");
const detailBody = $("detail-body");

function loadStored() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (Array.isArray(saved.earned)) state.earned = new Set(saved.earned);
    if (Array.isArray(saved.revealed)) state.revealed = new Set(saved.revealed);
    if (typeof saved.spoilerGuard === "boolean") state.spoilerGuard = saved.spoilerGuard;
  } catch (err) {
    console.warn("Stored progress could not be read; starting fresh.", err);
  }
}

function saveStored() {
  const payload = {
    earned: [...state.earned],
    revealed: [...state.revealed],
    spoilerGuard: state.spoilerGuard,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORE_KEY, JSON.stringify(payload));
}

function concealed(trophy) {
  return trophy.hidden && state.spoilerGuard && !state.revealed.has(trophy.name) && !state.earned.has(trophy.name);
}

function gradeMark(grade) {
  if (grade === "platinum") return "◆";
  if (grade === "gold") return "●";
  if (grade === "silver") return "●";
  return "●";
}

function trophyMatches(trophy) {
  if (state.grade !== "all" && trophy.grade !== state.grade) return false;
  if (state.kind !== "all" && trophy.kind !== state.kind) return false;
  if (state.missableOnly && !trophy.missable) return false;
  if (state.hiddenOnly && !trophy.hidden) return false;
  if (state.earnedOnly && !state.earned.has(trophy.name)) return false;
  if (state.query) {
    const hay = (trophy.name + " " + trophy.description + " " + trophy.guide).toLowerCase();
    if (!hay.includes(state.query)) return false;
  }
  return true;
}

function renderProgress() {
  const total = state.trophies.length;
  const done = state.earned.size;
  const pct = total ? Math.round((done / total) * 100) : 0;
  $("progress-fill").style.width = pct + "%";
  $("progress-text").textContent = done + " of " + total + " earned · " + pct + "%";
  const counts = {};
  for (const t of state.trophies) {
    counts[t.grade] = counts[t.grade] || { got: 0, total: 0 };
    counts[t.grade].total += 1;
    if (state.earned.has(t.name)) counts[t.grade].got += 1;
  }
  const order = ["platinum", "gold", "silver", "bronze"];
  $("grade-counts").textContent = order
    .filter((g) => counts[g])
    .map((g) => g + " " + counts[g].got + "/" + counts[g].total)
    .join(" · ");
}

function renderRoadmap() {
  const box = $("roadmap-list");
  box.innerHTML = "";
  for (const stage of state.roadmap) {
    const members = state.trophies.filter((t) => t.stage === stage.stage);
    const done = members.filter((t) => state.earned.has(t.name)).length;
    const item = document.createElement("li");
    if (members.length > 0 && done === members.length) item.className = "done";
    const head = document.createElement("h3");
    const num = document.createElement("span");
    num.className = "stage-no";
    num.textContent = "Stage " + stage.stage;
    head.append(num, document.createTextNode(stage.title));
    const summary = document.createElement("p");
    summary.textContent = stage.summary;
    const prog = document.createElement("p");
    prog.className = "stage-progress";
    prog.textContent = done + " of " + members.length + " trophies in this stage";
    item.append(head, summary, prog);
    box.append(item);
  }
}

function tag(text, cls) {
  const span = document.createElement("span");
  span.className = "tag " + cls;
  span.textContent = text;
  return span;
}

function renderList() {
  listEl.innerHTML = "";
  const shown = state.trophies.filter(trophyMatches);
  $("list-count").textContent = "(" + shown.length + " of " + state.trophies.length + ")";
  $("empty-note").hidden = shown.length > 0;

  for (const trophy of shown) {
    const item = document.createElement("li");
    item.className = "trophy" + (state.earned.has(trophy.name) ? " earned" : "") + (concealed(trophy) ? " concealed" : "");

    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = state.earned.has(trophy.name);
    box.setAttribute("aria-label", "Mark " + trophy.name + " earned");
    box.addEventListener("change", () => {
      if (box.checked) state.earned.add(trophy.name);
      else state.earned.delete(trophy.name);
      saveStored();
      renderAll();
    });

    const main = document.createElement("div");
    const name = document.createElement("div");
    name.className = "name";
    name.textContent = concealed(trophy) ? "Hidden trophy — tap to reveal" : trophy.name;
    const desc = document.createElement("div");
    desc.className = "desc";
    desc.textContent = concealed(trophy) ? "A story trophy. Its name and description stay hidden while the spoiler guard is on." : trophy.description;
    main.append(name, desc);

    const tags = document.createElement("div");
    tags.className = "tags";
    tags.append(tag(trophy.grade, trophy.grade));
    if (trophy.hidden) tags.append(tag("hidden", "hidden-t"));
    if (trophy.missable) tags.append(tag("missable", "missable"));
    tags.append(tag("stage " + trophy.stage, ""));
    if (trophy.counter) tags.append(tag(trophy.counter.target + " " + trophy.counter.unit, ""));

    const mark = document.createElement("span");
    mark.className = "grade-mark";
    mark.textContent = gradeMark(trophy.grade);
    mark.setAttribute("aria-hidden", "true");

    item.append(box, main, mark, tags);
    item.addEventListener("click", (event) => {
      if (event.target === box) return;
      openDetail(trophy);
    });
    listEl.append(item);
  }
}

function openDetail(trophy) {
  state.selected = trophy.name;
  detailBody.innerHTML = "";

  if (concealed(trophy)) {
    const head = document.createElement("h3");
    head.textContent = "Hidden trophy";
    const note = document.createElement("p");
    note.textContent = "This trophy is hidden on PlayStation until earned. The spoiler guard is keeping its name, description and guide out of sight.";
    const reveal = document.createElement("button");
    reveal.type = "button";
    reveal.className = "reveal-btn";
    reveal.textContent = "Reveal this trophy";
    reveal.addEventListener("click", () => {
      state.revealed.add(trophy.name);
      saveStored();
      renderAll();
      openDetail(trophy);
    });
    detailBody.append(head, note, reveal);
    detailEl.hidden = false;
    return;
  }

  const head = document.createElement("h3");
  head.textContent = trophy.name;
  const meta = document.createElement("p");
  meta.className = "muted";
  meta.textContent = trophy.grade + " · " + trophy.kind + " · stage " + trophy.stage + (trophy.hidden ? " · hidden" : "") + (trophy.missable ? " · missable" : "");

  const desc = document.createElement("p");
  const descLabel = document.createElement("strong");
  descLabel.textContent = "Official description: ";
  desc.append(descLabel, document.createTextNode(trophy.description));

  const guide = document.createElement("p");
  guide.textContent = trophy.guide;

  detailBody.append(head, meta, desc, guide);

  if (trophy.missable && trophy.missable_note) {
    const warn = document.createElement("p");
    warn.className = "missable-note";
    const label = document.createElement("strong");
    label.textContent = "Missable window: ";
    warn.append(label, document.createTextNode(trophy.missable_note));
    detailBody.append(warn);
  }

  if (trophy.counter) {
    const counter = document.createElement("p");
    counter.className = "counter-line";
    counter.textContent = "Counter: " + trophy.counter.target + " " + trophy.counter.unit + " (" + trophy.counter.label + ")";
    detailBody.append(counter);
  }

  if (Array.isArray(trophy.steps) && trophy.steps.length > 0) {
    const stepsHead = document.createElement("h4");
    stepsHead.textContent = "How to unlock it";
    const steps = document.createElement("ol");
    for (const step of trophy.steps) {
      const li = document.createElement("li");
      li.textContent = step;
      steps.append(li);
    }
    detailBody.append(stepsHead, steps);
  }

  if (Array.isArray(trophy.sources) && trophy.sources.length > 0) {
    const srcHead = document.createElement("h4");
    srcHead.textContent = "Sources";
    const srcList = document.createElement("ul");
    srcList.className = "sources";
    for (const source of trophy.sources) {
      const li = document.createElement("li");
      if (source.url) {
        const link = document.createElement("a");
        link.href = source.url;
        link.textContent = source.name;
        link.target = "_blank";
        link.rel = "noopener";
        li.append(link);
      } else {
        li.textContent = source.name;
      }
      srcList.append(li);
    }
    detailBody.append(srcHead, srcList);
  }

  const earnedBtn = document.createElement("button");
  earnedBtn.type = "button";
  earnedBtn.className = "reveal-btn";
  earnedBtn.textContent = state.earned.has(trophy.name) ? "Mark as not earned" : "Mark as earned";
  earnedBtn.addEventListener("click", () => {
    if (state.earned.has(trophy.name)) state.earned.delete(trophy.name);
    else state.earned.add(trophy.name);
    saveStored();
    renderAll();
    openDetail(trophy);
  });
  detailBody.append(earnedBtn);
  detailEl.hidden = false;
}

function closeDetail() {
  detailEl.hidden = true;
  state.selected = null;
}

function renderAll() {
  renderProgress();
  renderRoadmap();
  renderList();
}

function applyView(view) {
  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });
  if (view === "missables") {
    state.missableOnly = true;
    $("filter-missable").checked = true;
    renderList();
    listEl.scrollIntoView({ block: "start" });
  } else if (view === "roadmap") {
    $("roadmap").scrollIntoView();
  } else if (view === "spoilers") {
    state.spoilerGuard = true;
    $("spoiler-guard").checked = true;
    saveStored();
    renderAll();
    listEl.scrollIntoView({ block: "start" });
  } else {
    listEl.scrollIntoView({ block: "start" });
  }
}

function exportProgress() {
  const payload = {
    game: "Grand Theft Auto VI",
    exportedAt: new Date().toISOString(),
    earned: [...state.earned].sort(),
    revealed: [...state.revealed].sort(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "gta6-trophy-progress.json";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      if (!Array.isArray(data.earned)) throw new Error("bad file");
      const known = new Set(state.trophies.map((t) => t.name));
      state.earned = new Set(data.earned.filter((name) => known.has(name)));
      if (Array.isArray(data.revealed)) {
        state.revealed = new Set(data.revealed.filter((name) => known.has(name)));
      }
      saveStored();
      renderAll();
    } catch (err) {
      alert("That file is not a trophy progress export from this guide.");
    }
  };
  reader.readAsText(file);
}

function wireControls() {
  $("search").addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLowerCase();
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
    renderAll();
  });
  $("export-btn").addEventListener("click", exportProgress);
  $("import-btn").addEventListener("click", () => $("import-file").click());
  $("import-file").addEventListener("change", (event) => {
    if (event.target.files && event.target.files[0]) importProgress(event.target.files[0]);
    event.target.value = "";
  });
  $("reset-btn").addEventListener("click", () => {
    if (confirm("Clear all earned marks and reveals? This cannot be undone.")) {
      state.earned.clear();
      state.revealed.clear();
      saveStored();
      renderAll();
    }
  });
  $("detail-close").addEventListener("click", closeDetail);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeDetail();
  });
  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      location.hash = btn.dataset.view;
      applyView(btn.dataset.view);
    });
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
