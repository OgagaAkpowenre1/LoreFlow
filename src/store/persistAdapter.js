// ---------------------------------------------------------------------------
// STORAGE ADAPTER LAYER
//
// Zustand's `persist` middleware just needs an object shaped like
// { getItem, setItem, removeItem } (sync OR returning Promises — both are
// supported). This file provides two implementations of that shape —
// localStorage (legacy, small-project default) and IndexedDB (large-project,
// no practical size ceiling) — plus a mode flag that decides which one
// `store/index.js` hands to `createJSONStorage`.
//
// The mode flag deliberately lives in its own plain localStorage key,
// completely separate from the persisted project blob itself, so reading it
// never depends on which storage backend the project data is currently in.
//
// NOTE: switching modes at runtime (migrating existing data across, then
// flipping this flag) is a separate piece of work — this file only defines
// the two backends and which one is currently active.
// ---------------------------------------------------------------------------

export const STORAGE_MODES = {
  LOCAL_STORAGE: "localStorage",
  INDEXED_DB: "indexedDB",
};

// The single key persist writes the whole project blob under. Shared here
// (rather than duplicated as a string literal in index.js) so the migration
// function below is guaranteed to read/write the same key persist uses.
export const PERSIST_KEY = "lore-engine-storage";

const MODE_FLAG_KEY = "loreflow-storage-mode";
const DEFAULT_MODE = STORAGE_MODES.LOCAL_STORAGE;

export function getStorageMode() {
  try {
    const mode = window.localStorage.getItem(MODE_FLAG_KEY);
    return mode === STORAGE_MODES.INDEXED_DB
      ? STORAGE_MODES.INDEXED_DB
      : DEFAULT_MODE;
  } catch {
    // localStorage can throw in some locked-down/private-browsing contexts.
    return DEFAULT_MODE;
  }
}

export function setStorageModeFlag(mode) {
  window.localStorage.setItem(MODE_FLAG_KEY, mode);
}

// ---------------------------------------------------------------------------
// localStorage backend — thin passthrough, matches persist's expected shape.
// ---------------------------------------------------------------------------

const localStorageAdapter = {
  getItem: (name) => window.localStorage.getItem(name),
  setItem: (name, value) => window.localStorage.setItem(name, value),
  removeItem: (name) => window.localStorage.removeItem(name),
};

// ---------------------------------------------------------------------------
// IndexedDB backend — minimal single-object-store key/value wrapper.
// No extra dependency: IndexedDB's native API, promisified.
// ---------------------------------------------------------------------------

const IDB_DB_NAME = "loreflow-db";
const IDB_STORE_NAME = "keyval";
const IDB_VERSION = 1;

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const req = window.indexedDB.open(IDB_DB_NAME, IDB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
        db.createObjectStore(IDB_STORE_NAME);
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  return dbPromise;
}

async function idbGet(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, "readonly");
    const req = tx.objectStore(IDB_STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, "readwrite");
    tx.objectStore(IDB_STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbRemove(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, "readwrite");
    tx.objectStore(IDB_STORE_NAME).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Exported individually (not just via the adapter object) so the future
// mode-migration action can read/write both backends directly by key,
// without needing to fake a persist-shaped call.
export const indexedDBRaw = { get: idbGet, set: idbSet, remove: idbRemove };

const indexedDBAdapter = {
  getItem: (name) => idbGet(name),
  setItem: (name, value) => idbSet(name, value),
  removeItem: (name) => idbRemove(name),
};

export const localStorageRaw = {
  get: async (key) => window.localStorage.getItem(key),
  set: async (key, value) => window.localStorage.setItem(key, value),
  remove: async (key) => window.localStorage.removeItem(key),
};

// ---------------------------------------------------------------------------
// Public entry point used by store/index.js
// ---------------------------------------------------------------------------

export function getActiveStorageAdapter() {
  return getStorageMode() === STORAGE_MODES.INDEXED_DB
    ? indexedDBAdapter
    : localStorageAdapter;
}

export async function migrateStorageMode(targetMode) {
  const currentMode = getStorageMode();
  if (targetMode === currentMode) {
    return { migrated: false, reason: "already-active" };
  }

  const source =
    currentMode === STORAGE_MODES.INDEXED_DB ? indexedDBRaw : localStorageRaw;
  const destination =
    targetMode === STORAGE_MODES.INDEXED_DB ? indexedDBRaw : localStorageRaw;

  const existingBlob = await source.get(PERSIST_KEY);

  if (existingBlob) {
    await destination.set(PERSIST_KEY, existingBlob);
  }

  setStorageModeFlag(targetMode);

  return { migrated: true, hadExistingData: Boolean(existingBlob) };
}

// Untested