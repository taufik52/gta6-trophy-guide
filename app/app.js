/* Leonida Trophy Guide — tracker logic.
   Plain classic script, no libraries, no network at run time: it fetches
   only data/trophies.json next to this file and keeps all progress in
   localStorage. Deep links: ?view=roadmap|missables|about, ?open=<id>,
   ?spoilers=off, and ?demo=1 seeds sample progress for screenshots. */

(function () {
  "use strict";

  var DATA_URL = "data/trophies.json";
  var STORAGE_KEY = "leonida-trophy-guide-v2";
  var DEMO_EARNED = [2, 3, 4, 5, 8, 15, 16, 19, 21, 28, 35, 42, 53];
  var DEMO_COUNTS = { 15: 143, 17: 21, 19: 12, 31: 47, 32: 29, 35: 61, 42: 38 };

  var trophies = [];
  var roadmapStages = [];
  var byId = {};
  var state = { earned: {}, counts: {}, notes: {} };
  var currentView = "checklist";
  var openId = null;

  var listEl, missableListEl, roadmapListEl, detailPanel, listMetaEl, emptyNoteEl;
  var earnedCountEl, totalCountEl, progressFillEl, progressBarEl, progressNoteEl, gradeProgressEl;
  var searchBox, kindFilter, gradeFilter, spoilerToggle, hideEarnedToggle;

  function loadState() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        if (parsed.earned) state.earned = parsed.earned;
        if (parsed.counts) state.counts = parsed.counts;
        if (parsed.notes) state.notes = parsed.notes;
      }
    } catch (err) {
      state = { earned: {}, counts: {}, notes: {} };
    }
  }

  function saveState() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      /* Storage full or blocked: the page still works for this visit. */
    }
  }

  function seedDemoProgress() {
    var hasAnything = Object.keys(state.earned).length > 0 || Object.keys(state.counts).length > 0;
    if (hasAnything) return;
    DEMO_EARNED.forEach(function (id) { state.earned[id] = true; });
    Object.keys(DEMO_COUNTS).forEach(function (id) { state.counts[id] = DEMO_COUNTS[id]; });
    saveState();
  }

  function gradeLabel(grade) {
    return grade.charAt(0).toUpperCase() + grade.slice(1);
  }

  function kindLabel(kind) {
    var labels = {
      story: "Story", side: "Side missions", activities: "Activities",
      collectibles: "Collectibles", combat: "Combat", exploration: "Exploration",
      economy: "Money", completion: "Completion"
    };
    return labels[kind] || kind;
  }

  function isSpoilerHidden(trophy) {
    return spoilerToggle.checked && trophy.hidden && !state.earned[trophy.id];
  }

  function visibleName(trophy) {
    return isSpoilerHidden(trophy) ? "Hidden story trophy" : trophy.name;
  }

  function visibleDescription(trophy) {
    return isSpoilerHidden(trophy)
      ? "Earn this trophy to reveal its name and description."
      : trophy.description;
  }

  function countText(trophy) {
    if (!trophy.count) return "";
    var have = state.counts[trophy.id] || 0;
    return have + " / " + trophy.count;
  }

  function trophyMatchesFilters(trophy) {
    var q = searchBox.value.trim().toLowerCase();
    if (q) {
      var hay = (trophy.name + " " + trophy.description + " " + trophy.guide).toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    var kind = kindFilter.value;
    if (kind === "missable") {
      if (!trophy.missable) return false;
    } else if (kind !== "all" && trophy.kind !== kind) {
      return false;
    }
    if (gradeFilter.value !== "all" && trophy.grade !== gradeFilter.value) return false;
    if (hideEarnedToggle.checked && state.earned[trophy.id]) return false;
    return true;
  }

  function trophyCard(trophy) {
    var li = document.createElement("li");
    li.className = "trophy-card" + (state.earned[trophy.id] ? " earned" : "");
    li.dataset.id = String(trophy.id);

    var tick = document.createElement("button");
    tick.type = "button";
    tick.className = "tick";
    tick.textContent = state.earned[trophy.id] ? "✓" : "";
    tick.setAttribute("aria-label", state.earned[trophy.id] ? "Mark not earned: " + trophy.name : "Mark earned: " + trophy.name);
    tick.addEventListener("click", function (event) {
      event.stopPropagation();
      toggleEarned(trophy.id);
    });
    li.appendChild(tick);

    var name = document.createElement("span");
    name.className = "trophy-name" + (isSpoilerHidden(trophy) ? " spoiler-name" : "");
    name.textContent = visibleName(trophy);
    li.appendChild(name);

    var desc = document.createElement("p");
    desc.className = "trophy-desc";
    desc.textContent = visibleDescription(trophy);
    li.appendChild(desc);

    var meta = document.createElement("div");
    meta.className = "trophy-meta";
    var gradeBadge = document.createElement("span");
    gradeBadge.className = "badge " + trophy.grade;
    gradeBadge.textContent = gradeLabel(trophy.grade);
    meta.appendChild(gradeBadge);
    var kindBadge = document.createElement("span");
    kindBadge.className = "badge kind";
    kindBadge.textContent = kindLabel(trophy.kind);
    meta.appendChild(kindBadge);
    if (trophy.missable) {
      var missBadge = document.createElement("span");
      missBadge.className = "badge missable";
      missBadge.textContent = "Missable";
      meta.appendChild(missBadge);
    }
    if (trophy.hidden) {
      var hidBadge = document.createElement("span");
      hidBadge.className = "badge hidden-badge";
      hidBadge.textContent = "Hidden";
      meta.appendChild(hidBadge);
    }
    var stageBadge = document.createElement("span");
    stageBadge.className = "badge";
    stageBadge.textContent = "Stage " + trophy.stage;
    meta.appendChild(stageBadge);
    li.appendChild(meta);

    var count = document.createElement("span");
    count.className = "trophy-count";
    count.textContent = countText(trophy);
    li.appendChild(count);

    var hint = document.createElement("span");
    hint.className = "open-hint";
    hint.textContent = "Guide →";
    li.appendChild(hint);

    li.addEventListener("click", function () { showDetail(trophy.id); });
    return li;
  }

  function renderChecklist() {
    var shown = trophies.filter(trophyMatchesFilters);
    listEl.innerHTML = "";
    shown.forEach(function (trophy) { listEl.appendChild(trophyCard(trophy)); });
    emptyNoteEl.hidden = shown.length !== 0;
    listMetaEl.textContent = "Showing " + shown.length + " of " + trophies.length + " trophies.";
  }

  function renderMissables() {
    missableListEl.innerHTML = "";
    trophies.filter(function (t) { return t.missable; }).forEach(function (trophy) {
      missableListEl.appendChild(trophyCard(trophy));
    });
  }

  function renderRoadmap() {
    roadmapListEl.innerHTML = "";
    roadmapStages.forEach(function (stage) {
      var li = document.createElement("li");
      var h = document.createElement("h3");
      h.textContent = stage.title;
      li.appendChild(h);
      var p = document.createElement("p");
      p.textContent = stage.text;
      li.appendChild(p);
      var chips = document.createElement("div");
      chips.className = "stage-trophies";
      trophies.filter(function (t) { return t.stage === stage.stage; }).forEach(function (trophy) {
        var chip = document.createElement("span");
        chip.className = state.earned[trophy.id] ? "done" : "";
        chip.textContent = (state.earned[trophy.id] ? "✓ " : "") + visibleName(trophy);
        chips.appendChild(chip);
      });
      li.appendChild(chips);
      roadmapListEl.appendChild(li);
    });
  }

  function renderProgress() {
    var earned = trophies.filter(function (t) { return state.earned[t.id]; }).length;
    earnedCountEl.textContent = String(earned);
    totalCountEl.textContent = String(trophies.length);
    var pct = trophies.length ? Math.round((earned / trophies.length) * 100) : 0;
    progressFillEl.style.width = pct + "%";
    progressBarEl.setAttribute("aria-valuenow", String(earned));
    progressNoteEl.textContent = earned === 0
      ? "Tick a trophy when it pops. Progress is saved in this browser only."
      : earned === trophies.length
        ? "Platinum earned — congratulations, Leonida Legend."
        : pct + "% of the way to the platinum. " + (trophies.length - earned) + " trophies to go.";
    var grades = ["platinum", "gold", "silver", "bronze"];
    gradeProgressEl.innerHTML = "";
    grades.forEach(function (grade) {
      var total = trophies.filter(function (t) { return t.grade === grade; }).length;
      var got = trophies.filter(function (t) { return t.grade === grade && state.earned[t.id]; }).length;
      var span = document.createElement("span");
      var b = document.createElement("b");
      b.textContent = gradeLabel(grade) + " ";
      span.appendChild(b);
      span.appendChild(document.createTextNode(got + " / " + total));
      gradeProgressEl.appendChild(span);
    });
  }

  function renderAll() {
    renderProgress();
    renderChecklist();
    renderMissables();
    renderRoadmap();
    if (openId) showDetail(openId, true);
  }

  function toggleEarned(id) {
    if (state.earned[id]) delete state.earned[id];
    else state.earned[id] = true;
    saveState();
    renderAll();
  }

  function showDetail(id, keepScroll) {
    var trophy = byId[id];
    if (!trophy) return;
    openId = id;
    detailPanel.hidden = false;
    detailPanel.innerHTML = "";

    var h = document.createElement("h2");
    h.textContent = visibleName(trophy);
    detailPanel.appendChild(h);

    var desc = document.createElement("p");
    desc.className = "detail-desc";
    desc.textContent = visibleDescription(trophy);
    detailPanel.appendChild(desc);

    var meta = document.createElement("div");
    meta.className = "trophy-meta";
    ["grade", "kind"].forEach(function (key) {
      var badge = document.createElement("span");
      badge.className = "badge " + (key === "grade" ? trophy.grade : "kind");
      badge.textContent = key === "grade" ? gradeLabel(trophy.grade) : kindLabel(trophy.kind);
      meta.appendChild(badge);
    });
    if (trophy.missable) {
      var mb = document.createElement("span");
      mb.className = "badge missable";
      mb.textContent = "Missable — do it when the guide says";
      meta.appendChild(mb);
    }
    var sb = document.createElement("span");
    sb.className = "badge";
    sb.textContent = "Roadmap stage " + trophy.stage;
    meta.appendChild(sb);
    detailPanel.appendChild(meta);

    if (isSpoilerHidden(trophy)) {
      var veil = document.createElement("p");
      veil.textContent = "Spoilers are hidden for this trophy. Earn it in the game, tick it off above, and its guide will appear here.";
      detailPanel.appendChild(veil);
    } else {
      var guideHead = document.createElement("h3");
      guideHead.textContent = "Guide";
      detailPanel.appendChild(guideHead);
      var guide = document.createElement("p");
      guide.textContent = trophy.guide;
      detailPanel.appendChild(guide);

      var stepsHead = document.createElement("h3");
      stepsHead.textContent = "Steps";
      detailPanel.appendChild(stepsHead);
      var steps = document.createElement("ol");
      trophy.steps.forEach(function (step) {
        var li = document.createElement("li");
        li.textContent = step;
        steps.appendChild(li);
      });
      detailPanel.appendChild(steps);

      if (trophy.count) {
        var countHead = document.createElement("h3");
        countHead.textContent = "Your count";
        detailPanel.appendChild(countHead);
        var stepper = document.createElement("div");
        stepper.className = "stepper";
        var minus = document.createElement("button");
        minus.type = "button";
        minus.textContent = "−";
        minus.setAttribute("aria-label", "Decrease count");
        var out = document.createElement("output");
        out.textContent = countText(trophy);
        var plus = document.createElement("button");
        plus.type = "button";
        plus.textContent = "+";
        plus.setAttribute("aria-label", "Increase count");
        minus.addEventListener("click", function () { changeCount(trophy, -1); });
        plus.addEventListener("click", function () { changeCount(trophy, 1); });
        stepper.appendChild(minus);
        stepper.appendChild(out);
        stepper.appendChild(plus);
        detailPanel.appendChild(stepper);
        var countNote = document.createElement("p");
        countNote.textContent = "PSN tracks this one toward " + trophy.count + ". Keep your own count here until it pops.";
        detailPanel.appendChild(countNote);
      }

      var srcHead = document.createElement("h3");
      srcHead.textContent = "Sources";
      detailPanel.appendChild(srcHead);
      var srcList = document.createElement("ul");
      srcList.className = "source-list";
      trophy.sources.forEach(function (source) {
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.href = source.url;
        a.textContent = source.label;
        a.rel = "noopener";
        a.target = "_blank";
        li.appendChild(a);
        srcList.appendChild(li);
      });
      var own = document.createElement("li");
      own.textContent = "Guide text: written for this guide from the official description above.";
      srcList.appendChild(own);
      detailPanel.appendChild(srcList);
    }

    var noteHead = document.createElement("h3");
    noteHead.textContent = "Your note";
    detailPanel.appendChild(noteHead);
    var note = document.createElement("textarea");
    note.className = "note-box";
    note.placeholder = "A location, a loadout, a reminder…";
    note.value = state.notes[trophy.id] || "";
    note.addEventListener("input", function () {
      if (note.value.trim()) state.notes[trophy.id] = note.value;
      else delete state.notes[trophy.id];
      saveState();
    });
    detailPanel.appendChild(note);

    var actions = document.createElement("div");
    actions.className = "detail-actions";
    var earnBtn = document.createElement("button");
    earnBtn.type = "button";
    earnBtn.textContent = state.earned[trophy.id] ? "Mark as not earned" : "Mark as earned";
    earnBtn.addEventListener("click", function () { toggleEarned(trophy.id); });
    actions.appendChild(earnBtn);
    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.textContent = "Close guide";
    closeBtn.addEventListener("click", function () {
      openId = null;
      detailPanel.hidden = true;
      detailPanel.innerHTML = "";
    });
    actions.appendChild(closeBtn);
    detailPanel.appendChild(actions);

    /* The panel floats fixed at the bottom-right, so it is already in view. */
  }

  function changeCount(trophy, delta) {
    var next = Math.max(0, (state.counts[trophy.id] || 0) + delta);
    if (trophy.count) next = Math.min(trophy.count, next);
    state.counts[trophy.id] = next;
    if (next >= (trophy.count || 0) && trophy.count) state.earned[trophy.id] = true;
    saveState();
    renderAll();
  }

  function setView(view) {
    currentView = view;
    document.querySelectorAll(".tab").forEach(function (tab) {
      tab.classList.toggle("active", tab.dataset.view === view);
    });
    document.querySelectorAll(".view").forEach(function (section) {
      section.classList.toggle("active", section.id === "view-" + view);
    });
  }

  function exportProgress() {
    var payload = {
      app: "leonida-trophy-guide",
      exportedAt: new Date().toISOString(),
      earned: Object.keys(state.earned).map(Number),
      counts: state.counts,
      notes: state.notes
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "leonida-trophy-progress.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function importProgress(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = JSON.parse(String(reader.result));
        if (!parsed || typeof parsed !== "object") throw new Error("not an object");
        var next = { earned: {}, counts: {}, notes: {} };
        (parsed.earned || []).forEach(function (id) { if (byId[id]) next.earned[id] = true; });
        Object.keys(parsed.counts || {}).forEach(function (id) {
          if (byId[id]) next.counts[id] = Math.max(0, Number(parsed.counts[id]) || 0);
        });
        Object.keys(parsed.notes || {}).forEach(function (id) {
          if (byId[id] && String(parsed.notes[id]).trim()) next.notes[id] = String(parsed.notes[id]);
        });
        state = next;
        saveState();
        renderAll();
      } catch (err) {
        window.alert("That file is not a Leonida Trophy Guide export.");
      }
    };
    reader.readAsText(file);
  }

  function applyDeepLinks() {
    var params = new URLSearchParams(window.location.search);
    if (params.get("demo") === "1") seedDemoProgress();
    if (params.get("spoilers") === "off") spoilerToggle.checked = false;
    var view = params.get("view");
    if (view === "roadmap" || view === "missables" || view === "about") setView(view);
    var open = Number(params.get("open"));
    if (open && byId[open]) showDetail(open, true);
  }

  function bindControls() {
    searchBox.addEventListener("input", renderChecklist);
    kindFilter.addEventListener("change", renderChecklist);
    gradeFilter.addEventListener("change", renderChecklist);
    spoilerToggle.addEventListener("change", renderAll);
    hideEarnedToggle.addEventListener("change", renderChecklist);
    document.querySelectorAll(".tab").forEach(function (tab) {
      tab.addEventListener("click", function () { setView(tab.dataset.view); });
    });
    document.getElementById("exportBtn").addEventListener("click", exportProgress);
    var importFile = document.getElementById("importFile");
    document.getElementById("importBtn").addEventListener("click", function () { importFile.click(); });
    importFile.addEventListener("change", function () {
      if (importFile.files && importFile.files[0]) importProgress(importFile.files[0]);
      importFile.value = "";
    });
    document.getElementById("resetBtn").addEventListener("click", function () {
      if (!window.confirm("Reset all progress, counts and notes?")) return;
      state = { earned: {}, counts: {}, notes: {} };
      openId = null;
      detailPanel.hidden = true;
      detailPanel.innerHTML = "";
      saveState();
      renderAll();
    });
  }

  function boot() {
    listEl = document.getElementById("trophyList");
    missableListEl = document.getElementById("missableList");
    roadmapListEl = document.getElementById("roadmapList");
    detailPanel = document.getElementById("detailPanel");
    listMetaEl = document.getElementById("listMeta");
    emptyNoteEl = document.getElementById("emptyNote");
    earnedCountEl = document.getElementById("earnedCount");
    totalCountEl = document.getElementById("totalCount");
    progressFillEl = document.getElementById("progressFill");
    progressBarEl = document.getElementById("progressBar");
    progressNoteEl = document.getElementById("progressNote");
    gradeProgressEl = document.getElementById("gradeProgress");
    searchBox = document.getElementById("searchBox");
    kindFilter = document.getElementById("kindFilter");
    gradeFilter = document.getElementById("gradeFilter");
    spoilerToggle = document.getElementById("spoilerToggle");
    hideEarnedToggle = document.getElementById("hideEarnedToggle");

    loadState();
    bindControls();
    fetch(DATA_URL)
      .then(function (response) {
        if (!response.ok) throw new Error("trophies.json failed to load");
        return response.json();
      })
      .then(function (data) {
        trophies = data.trophies || [];
        roadmapStages = data.roadmap || [];
        trophies.forEach(function (t) { byId[t.id] = t; });
        applyDeepLinks();
        renderAll();
      })
      .catch(function () {
        listEl.innerHTML = "";
        listMetaEl.textContent = "The trophy data could not be loaded. Serve this folder with a static server and reload.";
      });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
