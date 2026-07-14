/**
 * storage.js — Draft persistence (ES6 module)
 */

const DRAFT_KEY = 'ambient-admin:draft';
const VERSION_KEY = 'ambient-admin:draft-version';

export const storage = {
  getDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  saveDraft(config) {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(config));
    localStorage.setItem(VERSION_KEY, String(Date.now()));
    return true;
  },

  clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(VERSION_KEY);
  },

  getDraftTimestamp() {
    const ts = localStorage.getItem(VERSION_KEY);
    return ts ? parseInt(ts, 10) : null;
  }
};
