/* ===================== Icon-Bausteine (inline SVG, currentColor) ===================== */
const ICON_POKEBALL = `<svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="14.5" fill="none" stroke="currentColor" stroke-width="3"/><rect x="3" y="16.5" width="30" height="3" fill="currentColor"/><circle cx="18" cy="18" r="4" fill="none" stroke="currentColor" stroke-width="2.5"/></svg>`;
const ICON_STAR = `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.2 21 12 17.27 5.8 21 7 14.14l-5-4.87 7.1-1.01z"/></svg>`;
const ICON_STAR_BADGE_PATH = `<path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.2 21 12 17.27 5.8 21 7 14.14l-5-4.87 7.1-1.01z"/>`;
const ICON_CHECK = `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>`;
const ICON_MAP = `<svg viewBox="0 0 24 24"><path fill="var(--text-muted)" d="M15 5.1L9 3 3 5v16l6-2.1 6 2.1 6-2V3zM9 5.2l6-2v15.6l-6 2z"/></svg>`;
const ICON_ARROW_RIGHT = `<svg viewBox="0 0 24 24"><path d="M4 11v2h12l-5.5 5.5 1.42 1.42L19.84 12l-7.92-7.92L10.5 5.5 16 11z"/></svg>`;

/* ===================== State ===================== */
const state = {
  allPokemon: [],
  searchQuery: "",
  caughtFilter: "ALL",
  selectedGenerations: new Set(GENERATIONS.map((g) => g.key)),
  trainerName: Prefs.getTrainerName(),
  currentDetailId: null,
  detailSelectedGame: {}      // { [pokemonId]: versionName }
};

/* ===================== DOM-Referenzen ===================== */
const el = {
  topbar: document.getElementById("topbar"),
  progressHeader: document.getElementById("progressHeader"),
  progressText: document.getElementById("progressText"),
  progressPercent: document.getElementById("progressPercent"),
  progressFill: document.getElementById("progressFill"),
  searchFilter: document.getElementById("searchFilter"),
  searchInput: document.getElementById("searchInput"),
  caughtFilterChips: document.getElementById("caughtFilterChips"),
  regionFilterChip: document.getElementById("regionFilterChip"),
  listContent: document.getElementById("listContent"),
  loadingState: document.getElementById("loadingState"),
  emptyState: document.getElementById("emptyState"),
  pokemonGrid: document.getElementById("pokemonGrid"),
  scrollTopButton: document.getElementById("scrollTopButton"),
  pokedexTitle: document.getElementById("pokedexTitle"),
  titleButton: document.getElementById("titleButton"),
  refreshButton: document.getElementById("refreshButton"),
  screenList: document.getElementById("screen-list"),
  screenDetail: document.getElementById("screen-detail"),
  detailTitle: document.getElementById("detailTitle"),
  backButton: document.getElementById("backButton"),
  detailLoading: document.getElementById("detailLoading"),
  detailBody: document.getElementById("detailBody"),
  overlay: document.getElementById("overlay"),
  trainerDialog: document.getElementById("trainerDialog"),
  trainerNameInput: document.getElementById("trainerNameInput"),
  trainerCancel: document.getElementById("trainerCancel"),
  trainerSave: document.getElementById("trainerSave"),
  regionSheet: document.getElementById("regionSheet"),
  regionList: document.getElementById("regionList"),
  regionSelectAll: document.getElementById("regionSelectAll"),
  regionSelectNone: document.getElementById("regionSelectNone"),
  regionDone: document.getElementById("regionDone"),
  gameSheet: document.getElementById("gameSheet"),
  gameList: document.getElementById("gameList"),
  gameSheetClose: document.getElementById("gameSheetClose"),
  toast: document.getElementById("toast")
};

/* ===================== Hilfsfunktionen ===================== */
function pad3(n) { return String(n).padStart(3, "0"); }

function possessiveTitle(name) {
  if (!name) return "Pokedex";
  const last = name.slice(-1).toLowerCase();
  const suffix = (last === "s" || last === "z" || last === "x") ? "'" : "s";
  return `${name}${suffix} Pokedex`;
}

function showToast(msg) {
  el.toast.textContent = msg;
  el.toast.classList.remove("hidden");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.toast.classList.add("hidden"), 2500);
}

function closeAllOverlays() {
  el.overlay.classList.add("hidden");
  el.trainerDialog.classList.add("hidden");
  el.regionSheet.classList.add("hidden");
  el.gameSheet.classList.add("hidden");
}

/* ===================== Liste rendern ===================== */
function matchesGenerationFilter(pokemon) {
  if (state.selectedGenerations.size === GENERATIONS.length) return true;
  return state.selectedGenerations.has(generationForId(pokemon.id).key);
}

function matchesCaughtFilter(pokemon) {
  if (state.caughtFilter === "CAUGHT") return pokemon.caught;
  if (state.caughtFilter === "MISSING") return !pokemon.caught;
  return true;
}

function matchesSearch(pokemon) {
  const q = state.searchQuery.trim().toLowerCase();
  if (!q) return true;
  return pokemon.name.toLowerCase().includes(q) || String(pokemon.id).startsWith(q);
}

function getFilteredList() {
  return state.allPokemon.filter(
    (p) => matchesSearch(p) && matchesCaughtFilter(p) && matchesGenerationFilter(p)
  );
}

function getRegionScopedProgress() {
  const scoped = state.allPokemon.filter(matchesGenerationFilter);
  return { total: scoped.length, caught: scoped.filter((p) => p.caught).length };
}

function renderProgressHeader() {
  const { total, caught } = getRegionScopedProgress();
  const pct = total > 0 ? Math.round((caught / total) * 100) : 0;
  el.progressText.textContent = `${caught} von ${total} gefangen`;
  el.progressPercent.textContent = `${pct}%`;
  el.progressFill.style.width = `${pct}%`;
}

function renderRegionChipLabel() {
  const count = state.selectedGenerations.size;
  el.regionFilterChip.textContent = count === GENERATIONS.length
    ? "Alle Regionen"
    : `Regionen: ${count}/${GENERATIONS.length}`;
  el.regionFilterChip.classList.toggle("active", count !== GENERATIONS.length);
}

function pokeCardHtml(p) {
  const shinyBadge = p.shiny ? `<svg class="shiny-badge" viewBox="0 0 24 24">${ICON_STAR_BADGE_PATH}</svg>` : "";
  return `
    <div class="poke-card" data-id="${p.id}">
      <div class="poke-card-top">
        <span class="poke-id">#${pad3(p.id)}</span>
        <button class="poke-toggle ${p.caught ? "caught" : ""}" data-action="toggle-caught" aria-label="Fangstatus umschalten">${ICON_POKEBALL}</button>
      </div>
      <div class="poke-image-wrap">
        <img src="${Repo.imageUrl(p.id, p.shiny)}" loading="lazy" alt="${p.name}">
        ${shinyBadge}
      </div>
      <div class="poke-name">${p.name}</div>
    </div>`;
}

function renderGrid() {
  const filtered = getFilteredList();
  renderProgressHeader();

  if (filtered.length === 0) {
    el.pokemonGrid.classList.add("hidden");
    el.emptyState.classList.remove("hidden");
    const msg = state.selectedGenerations.size === 0
      ? "Keine Region ausgewählt."
      : (state.caughtFilter === "MISSING" && getRegionScopedProgress().caught === getRegionScopedProgress().total && getRegionScopedProgress().total > 0)
        ? "Nichts fehlt hier – alle gefangen! 🎉"
        : "Keine Pokémon gefunden.";
    el.emptyState.querySelector("p").textContent = msg;
    return;
  }

  el.emptyState.classList.add("hidden");
  el.pokemonGrid.classList.remove("hidden");
  el.pokemonGrid.innerHTML = filtered.map(pokeCardHtml).join("");
}

/* Grid-Klicks per Event-Delegation (schneller als 1300 Einzel-Listener) */
el.pokemonGrid.addEventListener("click", async (e) => {
  const toggleBtn = e.target.closest('[data-action="toggle-caught"]');
  const card = e.target.closest(".poke-card");
  if (!card) return;
  const id = parseInt(card.dataset.id, 10);

  if (toggleBtn) {
    e.stopPropagation();
    const pokemon = state.allPokemon.find((p) => p.id === id);
    const newCaught = !pokemon.caught;
    pokemon.caught = newCaught;
    await Repo.setCaught(id, newCaught);
    renderGrid();
    return;
  }
  navigateToDetail(id);
});

/* ===================== Suche / Filter-Events ===================== */
let searchDebounce;
el.searchInput.addEventListener("input", () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    state.searchQuery = el.searchInput.value;
    renderGrid();
  }, 120);
});

el.caughtFilterChips.addEventListener("click", (e) => {
  const btn = e.target.closest(".chip");
  if (!btn) return;
  state.caughtFilter = btn.dataset.filter;
  [...el.caughtFilterChips.children].forEach((c) => c.classList.toggle("active", c === btn));
  renderGrid();
});

/* ===================== Trainername ===================== */
function openTrainerDialog() {
  el.trainerNameInput.value = state.trainerName;
  el.overlay.classList.remove("hidden");
  el.trainerDialog.classList.remove("hidden");
  el.trainerNameInput.focus();
}
el.titleButton.addEventListener("click", openTrainerDialog);
el.trainerCancel.addEventListener("click", closeAllOverlays);
el.overlay.addEventListener("click", closeAllOverlays);
el.trainerSave.addEventListener("click", () => {
  state.trainerName = el.trainerNameInput.value.trim();
  Prefs.setTrainerName(state.trainerName);
  el.pokedexTitle.textContent = possessiveTitle(state.trainerName);
  closeAllOverlays();
});

/* ===================== Regionen-Sheet ===================== */
function renderRegionSheet() {
  el.regionList.innerHTML = GENERATIONS.map((g) => {
    const checked = state.selectedGenerations.has(g.key);
    const range = g.key === "OTHER"
      ? "Mega-Entwicklungen, Gigadynamax & Co."
      : `#${pad3(g.min)} – #${pad3(g.max)}`;
    return `
      <label class="region-row">
        <input type="checkbox" data-key="${g.key}" ${checked ? "checked" : ""}>
        <span>
          <div class="region-name">${g.label}</div>
          <div class="region-range">${range}</div>
        </span>
      </label>`;
  }).join("");
}

function openRegionSheet() {
  renderRegionSheet();
  el.overlay.classList.remove("hidden");
  el.regionSheet.classList.remove("hidden");
}
el.regionFilterChip.addEventListener("click", openRegionSheet);

el.regionList.addEventListener("change", (e) => {
  const checkbox = e.target.closest("input[type=checkbox]");
  if (!checkbox) return;
  const key = checkbox.dataset.key;
  if (checkbox.checked) state.selectedGenerations.add(key);
  else state.selectedGenerations.delete(key);
  renderRegionChipLabel();
  renderGrid();
});

el.regionSelectAll.addEventListener("click", () => {
  state.selectedGenerations = new Set(GENERATIONS.map((g) => g.key));
  renderRegionSheet();
  renderRegionChipLabel();
  renderGrid();
});
el.regionSelectNone.addEventListener("click", () => {
  state.selectedGenerations = new Set();
  renderRegionSheet();
  renderRegionChipLabel();
  renderGrid();
});
el.regionDone.addEventListener("click", closeAllOverlays);

/* ===================== Kollabierender Header + Scroll-to-Top ===================== */
let lastScrollTop = 0;
el.listContent.addEventListener("scroll", () => {
  const st = el.listContent.scrollTop;
  const collapsed = st > 40;
  el.progressHeader.classList.toggle("collapsed", collapsed);
  el.searchFilter.classList.toggle("collapsed", collapsed);
  el.scrollTopButton.classList.toggle("hidden", st < 600);
  lastScrollTop = st;
}, { passive: true });

el.scrollTopButton.addEventListener("click", () => {
  el.listContent.scrollTo({ top: 0, behavior: "smooth" });
});

/* ===================== Refresh ===================== */
el.refreshButton.addEventListener("click", async () => {
  const icon = el.refreshButton.querySelector("svg");
  icon.classList.add("spin");
  try {
    await Repo.refreshPokemonList();
    state.allPokemon = await Db.getAllPokemon();
    renderGrid();
    showToast("Liste aktualisiert");
  } catch (e) {
    console.error(e);
    showToast("Aktualisierung fehlgeschlagen");
  } finally {
    icon.classList.remove("spin");
  }
});

/* ===================== Detail-Ansicht ===================== */
function navigateToDetail(id) {
  history.pushState({ screen: "detail", id }, "", `#pokemon/${id}`);
  showDetailScreen(id);
}

function goBack() {
  history.back();
}
el.backButton.addEventListener("click", goBack);

window.addEventListener("popstate", (e) => {
  const s = e.state;
  if (!s || s.screen === "list") {
    showListScreen();
  } else if (s.screen === "detail") {
    showDetailScreen(s.id);
  }
});

function showListScreen() {
  el.screenDetail.classList.remove("active");
  el.screenList.classList.add("active");
  state.currentDetailId = null;
  // Fang-/Shiny-Status könnte sich im Detail geändert haben.
  Db.getAllPokemon().then((list) => { state.allPokemon = list; renderGrid(); });
}

async function showDetailScreen(id) {
  state.currentDetailId = id;
  el.screenList.classList.remove("active");
  el.screenDetail.classList.add("active");
  el.detailBody.classList.add("hidden");
  el.detailLoading.classList.remove("hidden");
  el.detailTitle.textContent = "Pokémon";

  try {
    const detail = await Repo.getPokemonDetail(id);
    renderDetail(detail);
    el.detailLoading.classList.add("hidden");
    el.detailBody.classList.remove("hidden");
  } catch (e) {
    console.error(e);
    el.detailLoading.innerHTML = `<p>Details konnten nicht geladen werden. Prüfe deine Internetverbindung.</p>`;
  }
}

const TYPE_COLORS = {
  normal: "#A8A77A", fire: "#EE8130", water: "#6390F0", electric: "#F7D02C",
  grass: "#7AC74C", ice: "#96D9D6", fighting: "#C22E28", poison: "#A33EA1",
  ground: "#E2BF65", flying: "#A98FF3", psychic: "#F95587", bug: "#A6B91A",
  rock: "#B6A136", ghost: "#735797", dragon: "#6F35FC", dark: "#705746",
  steel: "#B7B7CE", fairy: "#D685AD"
};

function renderDetail(detail) {
  el.detailTitle.textContent = detail.name;
  const accent = TYPE_COLORS[detail.types[0]] || "#E3350D";

  const typesHtml = detail.types.map((t) =>
    `<span class="type-badge" style="background:${TYPE_COLORS[t] || "#777"}">${t}</span>`
  ).join("");

  const statsHtml = detail.stats.map((s) => {
    const pct = Math.min(100, Math.round((s.value / 255) * 100));
    return `
      <div class="stat-row">
        <span class="stat-name">${s.name}</span>
        <span class="stat-value">${s.value}</span>
        <div class="stat-track"><div class="stat-fill" style="width:${pct}%;background:${accent}"></div></div>
      </div>`;
  }).join("");

  const movesHtml = detail.moves.length === 0
    ? `<p class="muted">Keine Level-Attacken bekannt (z.B. nur per TM, Ei oder Tutor lernbar).</p>`
    : detail.moves.map((m, i) => `
      <div class="move-row">
        <span>${m.name}</span>
        <span class="muted">${m.level <= 1 ? "Start" : "Level " + m.level}</span>
      </div>`).join("");

  const evoHtml = renderEvolutionChain(detail.evolutionChain, detail.id);

  el.detailBody.innerHTML = `
    <div class="detail-hero" style="background:${hexToRgba(accent, .12)}">
      <span class="poke-id muted">#${pad3(detail.id)}</span>
      <img src="${detail.imageUrl}" alt="${detail.name}">
      <div class="type-row">${typesHtml}</div>
      <div class="toggle-row">
        <div class="toggle-col">
          <button class="toggle-btn caught ${detail.caught ? "active" : ""}" id="detailCaughtBtn">${ICON_POKEBALL}</button>
          <span class="toggle-label">${detail.caught ? "Gefangen" : "Als gefangen markieren"}</span>
        </div>
        <div class="toggle-col">
          <button class="toggle-btn shiny ${detail.shiny ? "active" : ""}" id="detailShinyBtn">${ICON_STAR}</button>
          <span class="toggle-label">${detail.shiny ? "Shiny ✨" : "Als Shiny markieren"}</span>
        </div>
      </div>
    </div>

    <div class="section-card"><h2>Beschreibung</h2><p>${detail.description}</p></div>

    <div class="section-card">
      <h2>Eigenschaften</h2>
      <div class="prop-row">
        <div class="prop-col"><span class="prop-value">${detail.heightMeters.toFixed(1)} m</span><span class="prop-label">Größe</span></div>
        <div class="prop-col"><span class="prop-value">${detail.weightKg.toFixed(1)} kg</span><span class="prop-label">Gewicht</span></div>
      </div>
    </div>

    <div class="section-card"><h2>Basiswerte</h2>${statsHtml}</div>

    <div class="section-card"><h2>Attacken</h2>${movesHtml}</div>

    <div class="section-card"><h2>Entwicklung</h2>${evoHtml}</div>

    <div class="section-card" id="encountersSection"><h2>Fundorte</h2><p class="muted">Lade Fundorte …</p></div>
  `;

  document.getElementById("detailCaughtBtn").addEventListener("click", async () => {
    const newCaught = !detail.caught;
    detail.caught = newCaught;
    await Repo.setCaught(detail.id, newCaught);
    const localP = state.allPokemon.find((p) => p.id === detail.id);
    if (localP) localP.caught = newCaught;
    renderDetail(detail);
  });

  document.getElementById("detailShinyBtn").addEventListener("click", async () => {
    const newShiny = !detail.shiny;
    detail.shiny = newShiny;
    detail.imageUrl = Repo.imageUrl(detail.id, newShiny);
    await Repo.setShiny(detail.id, newShiny);
    const localP = state.allPokemon.find((p) => p.id === detail.id);
    if (localP) localP.shiny = newShiny;
    renderDetail(detail);
  });

  el.detailBody.querySelectorAll(".evo-stage[data-id]").forEach((node) => {
    node.addEventListener("click", () => {
      const targetId = parseInt(node.dataset.id, 10);
      if (targetId !== detail.id) navigateToDetail(targetId);
    });
  });

  loadEncounters(detail.id);
}

function hexToRgba(hex, alpha) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function renderEvolutionChain(chain, currentId) {
  if (!chain || chain.length === 0) {
    return `<p class="muted">Keine Entwicklungsdaten verfügbar - dieses Pokémon entwickelt sich vermutlich nicht.</p>`;
  }
  let html = `<div class="evo-scroll">`;
  chain.forEach((stage, i) => {
    if (i !== 0) {
      html += `
        <div class="evo-arrow">
          ${ICON_ARROW_RIGHT}
          ${stage.condition ? `<span>${stage.condition}</span>` : ""}
        </div>`;
    }
    const isCurrent = stage.speciesId === currentId;
    html += `
      <div class="evo-stage ${isCurrent ? "current" : ""}" data-id="${stage.speciesId}">
        <img src="${stage.imageUrl}" alt="${stage.name}">
        <span class="name">${stage.name}</span>
      </div>`;
  });
  html += `</div>`;
  return html;
}

/* ===================== Fundorte ===================== */
async function loadEncounters(pokemonId) {
  const section = document.getElementById("encountersSection");
  if (!section) return;
  try {
    const games = await Repo.getEncounters(pokemonId);
    if (state.currentDetailId !== pokemonId) return; // Nutzer ist schon weitergesprungen

    if (games.length === 0) {
      section.innerHTML = `<h2>Fundorte</h2><p class="muted">In den Hauptspielen nicht wild fangbar - z.B. nur durch Entwicklung, Tausch oder ein besonderes Ereignis erhältlich.</p>`;
      return;
    }

    const selectedVersion = state.detailSelectedGame[pokemonId] || null;
    const selectedGame = games.find((g) => g.versionName === selectedVersion) || null;

    section.innerHTML = `
      <h2>Fundorte</h2>
      <button class="game-picker-btn" id="gamePickerBtn">${selectedGame ? selectedGame.displayName : `Spiel auswählen (${games.length})`}</button>
      <div id="locationsList" style="margin-top:14px;"></div>
    `;

    document.getElementById("gamePickerBtn").addEventListener("click", () => openGameSheet(pokemonId, games));

    if (selectedGame) renderLocations(selectedGame);
  } catch (e) {
    console.error(e);
    section.innerHTML = `<h2>Fundorte</h2><p class="muted">Fundorte konnten nicht geladen werden. Prüfe deine Internetverbindung.</p>`;
  }
}

function renderLocations(game) {
  const container = document.getElementById("locationsList");
  if (!container) return;
  if (game.locations.length === 0) {
    container.innerHTML = `<p class="muted">Für ${game.displayName} sind keine konkreten Fundorte hinterlegt.</p>`;
    return;
  }
  container.innerHTML = game.locations.map((loc) => {
    const levelText = loc.minLevel === loc.maxLevel ? `Level ${loc.minLevel}` : `Level ${loc.minLevel}–${loc.maxLevel}`;
    return `
      <div class="location-row" data-area="${encodeURIComponent(loc.areaName)}">
        <div>
          <div class="name">${loc.areaName}</div>
          <div class="meta">${levelText} · ${loc.methods.join(", ")}</div>
        </div>
        ${ICON_MAP}
      </div>`;
  }).join("");

  container.querySelectorAll(".location-row").forEach((row) => {
    row.addEventListener("click", () => {
      const areaName = decodeURIComponent(row.dataset.area);
      const url = "https://bulbapedia.bulbagarden.net/w/index.php?search=" + encodeURIComponent(areaName);
      window.open(url, "_blank", "noopener");
    });
  });
}

function openGameSheet(pokemonId, games) {
  el.gameList.innerHTML = games.map((g) => `
    <div class="game-row" data-version="${g.versionName}">
      <span>${g.displayName}</span>
      <span class="count">${g.locations.length} Orte</span>
    </div>`).join("");

  el.gameList.querySelectorAll(".game-row").forEach((row) => {
    row.addEventListener("click", () => {
      state.detailSelectedGame[pokemonId] = row.dataset.version;
      closeAllOverlays();
      loadEncounters(pokemonId);
    });
  });

  el.overlay.classList.remove("hidden");
  el.gameSheet.classList.remove("hidden");
}
el.gameSheetClose.addEventListener("click", closeAllOverlays);

/* ===================== Start ===================== */
async function init() {
  el.pokedexTitle.textContent = possessiveTitle(state.trainerName);

  // Initialen History-Eintrag setzen, damit "Zurück" von der Detailseite funktioniert.
  history.replaceState({ screen: "list" }, "", "#");

  try {
    await Repo.ensurePokemonListLoaded();
    state.allPokemon = await Db.getAllPokemon();
    el.loadingState.classList.add("hidden");
    renderRegionChipLabel();
    renderGrid();
  } catch (e) {
    console.error(e);
    el.loadingState.innerHTML = `<p>Pokémon konnten nicht geladen werden. Prüfe deine Internetverbindung.</p>`;
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch((e) => console.warn("SW-Registrierung fehlgeschlagen", e));
  }
}

init();
