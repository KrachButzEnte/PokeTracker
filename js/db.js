/**
 * Kleiner IndexedDB-Wrapper. Übernimmt die Rolle, die in der Android-App
 * Room + SharedPreferences hatten: Pokémon-Liste (inkl. Fang-/Shiny-Status),
 * Detail-Cache (Werte/Attacken/Entwicklung) und Fundort-Cache.
 */
const DB_NAME = "pokedex_tracker_db";
const DB_VERSION = 1;

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("pokemon")) {
        db.createObjectStore("pokemon", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("detail")) {
        db.createObjectStore("detail", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("encounters")) {
        db.createObjectStore("encounters", { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

function tx(storeName, mode) {
  return openDb().then((db) => db.transaction(storeName, mode).objectStore(storeName));
}

function reqToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

const Db = {
  async getAllPokemon() {
    const store = await tx("pokemon", "readonly");
    return reqToPromise(store.getAll());
  },

  async countPokemon() {
    const store = await tx("pokemon", "readonly");
    return reqToPromise(store.count());
  },

  async putPokemonBulk(list) {
    const store = await tx("pokemon", "readwrite");
    return new Promise((resolve, reject) => {
      list.forEach((p) => store.put(p));
      store.transaction.oncomplete = () => resolve();
      store.transaction.onerror = () => reject(store.transaction.error);
    });
  },

  async getPokemon(id) {
    const store = await tx("pokemon", "readonly");
    return reqToPromise(store.get(id));
  },

  async updatePokemonField(id, field, value) {
    const store = await tx("pokemon", "readwrite");
    const current = await reqToPromise(store.get(id));
    if (!current) return;
    current[field] = value;
    return reqToPromise(store.put(current));
  },

  async getDetail(id) {
    const store = await tx("detail", "readonly");
    return reqToPromise(store.get(id));
  },

  async putDetail(entry) {
    const store = await tx("detail", "readwrite");
    return reqToPromise(store.put(entry));
  },

  async clearDetailCache() {
    const store = await tx("detail", "readwrite");
    return reqToPromise(store.clear());
  },

  async getEncounters(id) {
    const store = await tx("encounters", "readonly");
    return reqToPromise(store.get(id));
  },

  async putEncounters(entry) {
    const store = await tx("encounters", "readwrite");
    return reqToPromise(store.put(entry));
  }
};

// Kleine Einstellungen (Trainername) reichen bequem in localStorage.
const Prefs = {
  getTrainerName() {
    return localStorage.getItem("trainerName") || "";
  },
  setTrainerName(name) {
    localStorage.setItem("trainerName", name.trim());
  }
};
