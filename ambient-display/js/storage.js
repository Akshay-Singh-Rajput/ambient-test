/**
 * storage.js — localStorage wrapper for Ambient Display
 *
 * Provides namespaced key/value storage with JSON serialization.
 * Falls back to an in-memory store when localStorage is unavailable
 * (private browsing, quota exceeded, or restricted environments).
 */

/* global AmbientDisplay */
var AmbientDisplay = AmbientDisplay || {};

AmbientDisplay.storage = (function () {
  var PREFIX = 'ambient-display:';
  var memoryStore = {};
  var storageAvailable = false;

  /**
   * Probe localStorage once at init — avoids throwing on every read/write.
   */
  function detectStorage() {
    try {
      var probeKey = PREFIX + '__probe__';
      window.localStorage.setItem(probeKey, '1');
      window.localStorage.removeItem(probeKey);
      storageAvailable = true;
    } catch (ignore) {
      storageAvailable = false;
    }
  }

  function namespacedKey(key) {
    return PREFIX + key;
  }

  /**
   * Read a stored value. Returns null when the key is missing or unreadable.
   */
  function get(key) {
    var raw;

    if (storageAvailable) {
      try {
        raw = window.localStorage.getItem(namespacedKey(key));
      } catch (ignore) {
        return null;
      }
    } else {
      raw = memoryStore.hasOwnProperty(key) ? memoryStore[key] : null;
    }

    if (raw === null || raw === undefined) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch (parseError) {
      return null;
    }
  }

  /**
   * Persist a JSON-serializable value under the given key.
   */
  function set(key, value) {
    var serialized = JSON.stringify(value);

    if (storageAvailable) {
      try {
        window.localStorage.setItem(namespacedKey(key), serialized);
        return true;
      } catch (ignore) {
        return false;
      }
    }

    memoryStore[key] = serialized;
    return true;
  }

  /**
   * Remove a stored key.
   */
  function remove(key) {
    if (storageAvailable) {
      try {
        window.localStorage.removeItem(namespacedKey(key));
        return true;
      } catch (ignore) {
        return false;
      }
    }

    if (memoryStore.hasOwnProperty(key)) {
      delete memoryStore[key];
    }

    return true;
  }

  /**
   * Check whether a key exists in storage.
   */
  function has(key) {
    if (storageAvailable) {
      try {
        return window.localStorage.getItem(namespacedKey(key)) !== null;
      } catch (ignore) {
        return false;
      }
    }

    return memoryStore.hasOwnProperty(key);
  }

  detectStorage();

  return {
    get: get,
    set: set,
    remove: remove,
    has: has
  };
}());
