const API_BASE = "https://pokeapi.co/api/v2/";
const GERMAN_NAMES_CSV_URL = "https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/pokemon_species_names.csv";
const GERMAN_MOVE_NAMES_CSV_URL = "https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/move_names.csv";
const GERMAN_LANGUAGE_ID = 6;

const VERSION_GROUP_ORDER = [
  "red-blue", "yellow", "gold-silver", "crystal", "ruby-sapphire", "emerald",
  "firered-leafgreen", "diamond-pearl", "platinum", "heartgold-soulsilver",
  "black-white", "black-2-white-2", "x-y", "omega-ruby-alpha-sapphire",
  "sun-moon", "ultra-sun-ultra-moon", "lets-go-pikachu-lets-go-eevee",
  "sword-shield", "brilliant-diamond-and-shining-pearl", "legends-arceus",
  "scarlet-violet"
];

const GAME_DISPLAY_NAMES = {
  "red": "Rot", "blue": "Blau", "yellow": "Gelb", "gold": "Gold", "silver": "Silber",
  "crystal": "Kristall", "ruby": "Rubin", "sapphire": "Saphir", "emerald": "Smaragd",
  "firered": "Feuerrot", "leafgreen": "Blattgrün", "diamond": "Diamant", "pearl": "Perl",
  "platinum": "Platin", "heartgold": "HeartGold", "soulsilver": "SoulSilver",
  "black": "Schwarz", "white": "Weiß", "black-2": "Schwarz 2", "white-2": "Weiß 2",
  "x": "X", "y": "Y", "omega-ruby": "Omega Rubin", "alpha-sapphire": "Alpha Saphir",
  "sun": "Sonne", "moon": "Mond", "ultra-sun": "Ultrasonne", "ultra-moon": "Ultramond",
  "lets-go-pikachu": "Let's Go, Pikachu!", "let-s-go-pikachu": "Let's Go, Pikachu!",
  "lets-go-eevee": "Let's Go, Evoli!", "let-s-go-eevee": "Let's Go, Evoli!",
  "sword": "Schwert", "shield": "Schild", "brilliant-diamond": "Strahlender Diamant",
  "shining-pearl": "Leuchtende Perle", "legends-arceus": "Legenden: Arceus",
  "scarlet": "Karmesin", "violet": "Purpur"
};

const METHOD_DISPLAY_NAMES = {
  "walk": "Gras / Laufen", "surf": "Surfen", "old-rod": "Alte Angel",
  "good-rod": "Gute Angel", "super-rod": "Super-Angel", "rock-smash": "Zerschlagen",
  "headbutt": "Kopfnuss", "gift": "Geschenk", "gift-egg": "Ei-Geschenk",
  "only-one": "Einmaliges Ereignis", "cave": "Höhle"
};

/** Nationale Dex-Bereiche pro Region (identisch zur Android-App). */
const GENERATIONS = [
  { key: "GEN_1", label: "Kanto", min: 1, max: 151 },
  { key: "GEN_2", label: "Johto", min: 152, max: 251 },
  { key: "GEN_3", label: "Hoenn", min: 252, max: 386 },
  { key: "GEN_4", label: "Sinnoh", min: 387, max: 493 },
  { key: "GEN_5", label: "Einall", min: 494, max: 649 },
  { key: "GEN_6", label: "Kalos", min: 650, max: 721 },
  { key: "GEN_7", label: "Alola", min: 722, max: 809 },
  { key: "GEN_8", label: "Galar", min: 810, max: 905 },
  { key: "GEN_9", label: "Paldea", min: 906, max: 1025 },
  { key: "OTHER", label: "Formen & Sonderfälle", min: 1026, max: Infinity }
];

function generationForId(id) {
  return GENERATIONS.find((g) => id >= g.min && id <= g.max) || GENERATIONS[GENERATIONS.length - 1];
}

function idFromUrl(url) {
  const trimmed = url.replace(/\/$/, "");
  const parts = trimmed.split("/");
  const n = parseInt(parts[parts.length - 1], 10);
  return Number.isNaN(n) ? 0 : n;
}

function officialArtworkUrl(id, shiny) {
  const sub = shiny ? "shiny/" : "";
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${sub}${id}.png`;
}

function prettifyName(raw) {
  return raw.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function prettifyAreaName(raw) {
  return prettifyName(raw.replace(/-area$/, ""));
}

function prettifyMethod(raw) {
  return METHOD_DISPLAY_NAMES[raw] || prettifyName(raw);
}

function gameDisplayName(versionName) {
  return GAME_DISPLAY_NAMES[versionName] || prettifyName(versionName);
}

function formatStatName(raw) {
  const map = {
    hp: "KP", attack: "Angriff", defense: "Verteidigung",
    "special-attack": "Spez.-Angriff", "special-defense": "Spez.-Verteidigung", speed: "Initiative"
  };
  return map[raw] || prettifyName(raw);
}

/** Rohe Netzwerk-Aufrufe gegen die PokéAPI. */
const Api = {
  async json(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Request fehlgeschlagen: ${url} (${res.status})`);
    return res.json();
  },
  getPokemonList() {
    return this.json(`${API_BASE}pokemon?limit=100000&offset=0`);
  },
  getPokemonDetail(id) {
    return this.json(`${API_BASE}pokemon/${id}`);
  },
  getPokemonSpecies(id) {
    return this.json(`${API_BASE}pokemon-species/${id}`);
  },
  getPokemonEncounters(id) {
    return this.json(`${API_BASE}pokemon/${id}/encounters`);
  },
  getEvolutionChain(id) {
    return this.json(`${API_BASE}evolution-chain/${id}`);
  },
  async getCsvText(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`CSV-Abruf fehlgeschlagen: ${url}`);
    return res.text();
  }
};

/**
 * Enthält die "Business-Logik": Caching, deutsche Namen, Attacken-Auswahl,
 * Entwicklungskette flach machen usw. - 1:1 das Pendant zum Kotlin-Repository.
 */
const Repo = {
  async fetchGermanNameMap() {
    try {
      const text = await Api.getCsvText(GERMAN_NAMES_CSV_URL);
      const map = new Map();
      for (const line of text.split("\n")) {
        const parts = line.split(",");
        if (parts.length < 3) continue;
        const speciesId = parseInt(parts[0], 10);
        const languageId = parseInt(parts[1], 10);
        if (Number.isNaN(speciesId) || languageId !== GERMAN_LANGUAGE_ID) continue;
        map.set(speciesId, parts[2].trim());
      }
      return map;
    } catch (e) {
      console.warn("Deutsche Namen konnten nicht geladen werden, nutze Englisch.", e);
      return new Map();
    }
  },

  async fetchGermanMoveNameMap() {
    try {
      const text = await Api.getCsvText(GERMAN_MOVE_NAMES_CSV_URL);
      const map = new Map();
      for (const line of text.split("\n")) {
        const parts = line.split(",");
        if (parts.length < 3) continue;
        const moveId = parseInt(parts[0], 10);
        const languageId = parseInt(parts[1], 10);
        if (Number.isNaN(moveId) || languageId !== GERMAN_LANGUAGE_ID) continue;
        map.set(moveId, parts[2].trim());
      }
      return map;
    } catch (e) {
      console.warn("Deutsche Attacken-Namen konnten nicht geladen werden.", e);
      return new Map();
    }
  },

  async ensurePokemonListLoaded() {
    const count = await Db.countPokemon();
    if (count > 0) return;
    await this.refreshPokemonList();
  },

  async refreshPokemonList() {
    const [list, germanNames] = await Promise.all([
      Api.getPokemonList(),
      this.fetchGermanNameMap()
    ]);
    const existing = await Db.getAllPokemon();
    const caughtMap = new Map(existing.map((p) => [p.id, p.caught]));
    const shinyMap = new Map(existing.map((p) => [p.id, p.shiny]));

    const entries = list.results
      .map((item) => {
        const id = idFromUrl(item.url);
        if (id === 0) return null;
        return {
          id,
          name: germanNames.get(id) || prettifyName(item.name),
          caught: caughtMap.get(id) || false,
          shiny: shinyMap.get(id) || false
        };
      })
      .filter(Boolean);

    await Db.putPokemonBulk(entries);
  },

  imageUrl(id, shiny) {
    return officialArtworkUrl(id, !!shiny);
  },

  async setCaught(id, caught) {
    await Db.updatePokemonField(id, "caught", caught);
  },

  async setShiny(id, shiny) {
    await Db.updatePokemonField(id, "shiny", shiny);
  },

  async getPokemonDetail(id) {
    const basic = await Db.getPokemon(id);
    if (!basic) throw new Error(`Pokémon ${id} nicht in der lokalen Liste gefunden`);

    let cached = await Db.getDetail(id);
    if (!cached) {
      cached = await this.fetchAndCacheDetail(id);
    }

    return {
      id: basic.id,
      name: basic.name,
      imageUrl: this.imageUrl(basic.id, basic.shiny),
      caught: basic.caught,
      shiny: basic.shiny,
      heightMeters: cached.heightDm / 10,
      weightKg: cached.weightHg / 10,
      types: cached.types,
      stats: cached.stats,
      description: cached.description,
      moves: cached.moves,
      evolutionChain: cached.evolutionChain
    };
  },

  async fetchAndCacheDetail(id) {
    const [detailDto, speciesDto] = await Promise.all([
      Api.getPokemonDetail(id),
      Api.getPokemonSpecies(id)
    ]);

    const germanFlavor = speciesDto.flavor_text_entries.find((f) => f.language.name === "de")
      || speciesDto.flavor_text_entries.find((f) => f.language.name === "en");
    const description = germanFlavor
      ? germanFlavor.flavor_text.replace(/\n|\f/g, " ").replace(/\s+/g, " ").trim()
      : "Keine Beschreibung verfügbar.";

    const types = [...detailDto.types].sort((a, b) => a.slot - b.slot).map((t) => t.type.name);
    const stats = detailDto.stats.map((s) => ({
      name: formatStatName(s.stat.name),
      value: s.base_stat
    }));

    const moves = await this.buildLevelUpMoves(detailDto.moves);
    const evolutionChain = speciesDto.evolution_chain
      ? await this.buildEvolutionChain(idFromUrl(speciesDto.evolution_chain.url))
      : [];

    const entry = {
      id,
      heightDm: detailDto.height,
      weightHg: detailDto.weight,
      types, stats, description, moves, evolutionChain
    };
    await Db.putDetail(entry);
    return entry;
  },

  async buildLevelUpMoves(movesDto) {
    const availableGroups = [...new Set(
      movesDto.flatMap((m) => m.version_group_details.map((v) => v.version_group.name))
    )];
    if (availableGroups.length === 0) return [];

    let latestGroup = availableGroups[0];
    let bestIndex = -1;
    for (const g of availableGroups) {
      const idx = VERSION_GROUP_ORDER.indexOf(g);
      if (idx > bestIndex) { bestIndex = idx; latestGroup = g; }
    }

    const germanMoveNames = await this.fetchGermanMoveNameMap();

    const moves = movesDto
      .map((moveDto) => {
        const versionDetail = moveDto.version_group_details.find(
          (v) => v.version_group.name === latestGroup && v.move_learn_method.name === "level-up"
        );
        if (!versionDetail) return null;
        const moveId = idFromUrl(moveDto.move.url);
        return {
          name: germanMoveNames.get(moveId) || prettifyName(moveDto.move.name),
          level: versionDetail.level_learned_at
        };
      })
      .filter(Boolean);

    moves.sort((a, b) => a.level - b.level);
    return moves;
  },

  async buildEvolutionChain(chainId) {
    if (!chainId) return [];
    try {
      const chainDto = await Api.getEvolutionChain(chainId);
      const stages = [];
      await this.flattenEvolutionChain(chainDto.chain, null, stages);
      return stages;
    } catch (e) {
      console.warn("Entwicklungskette konnte nicht geladen werden.", e);
      return [];
    }
  },

  async flattenEvolutionChain(link, incomingCondition, output) {
    const speciesId = idFromUrl(link.species.url);
    const localEntity = await Db.getPokemon(speciesId);
    const name = (localEntity && localEntity.name) || prettifyName(link.species.name);

    output.push({
      speciesId,
      name,
      imageUrl: this.imageUrl(speciesId, false),
      condition: incomingCondition
    });

    for (const next of link.evolves_to || []) {
      const detail = (next.evolution_details && next.evolution_details[0]) || null;
      const condition = this.describeEvolutionDetail(detail);
      await this.flattenEvolutionChain(next, condition, output);
    }
  },

  describeEvolutionDetail(detail) {
    if (!detail) return null;
    if (detail.min_level != null) return `Level ${detail.min_level}`;
    if (detail.item) return prettifyName(detail.item.name);
    if (detail.known_move) return `kennt ${prettifyName(detail.known_move.name)}`;
    if (detail.min_happiness != null) return "Freundschaft";
    if (detail.trigger) {
      if (detail.trigger.name === "trade") return "Tausch";
      if (detail.trigger.name === "shed") return "freier Platz + Pokéball";
      return prettifyName(detail.trigger.name);
    }
    return null;
  },

  async getEncounters(id) {
    const cached = await Db.getEncounters(id);
    if (cached) return cached.games;

    const raw = await Api.getPokemonEncounters(id);

    const byVersion = new Map();
    for (const encounter of raw) {
      const areaName = prettifyAreaName(encounter.location_area.name);
      for (const vd of encounter.version_details) {
        const versionName = vd.version.name;
        if (!byVersion.has(versionName)) byVersion.set(versionName, new Map());
        const areasMap = byVersion.get(versionName);
        const methods = vd.encounter_details.map((d) => prettifyMethod(d.method.name));
        const minLevel = Math.min(...vd.encounter_details.map((d) => d.min_level));
        const maxLevel = Math.max(...vd.encounter_details.map((d) => d.max_level));
        if (!areasMap.has(areaName)) {
          areasMap.set(areaName, { areaName, methods: new Set(methods), minLevel, maxLevel });
        } else {
          const existing = areasMap.get(areaName);
          methods.forEach((m) => existing.methods.add(m));
          existing.minLevel = Math.min(existing.minLevel, minLevel);
          existing.maxLevel = Math.max(existing.maxLevel, maxLevel);
        }
      }
    }

    const games = [...byVersion.entries()]
      .map(([versionName, areasMap]) => ({
        versionName,
        displayName: gameDisplayName(versionName),
        locations: [...areasMap.values()]
          .map((l) => ({ ...l, methods: [...l.methods] }))
          .sort((a, b) => a.areaName.localeCompare(b.areaName))
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));

    await Db.putEncounters({ id, games });
    return games;
  }
};
