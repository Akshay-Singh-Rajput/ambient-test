/**
 * storage.js — Draft persistence for Ambient Display Admin
 *
 * Saves the in-progress config to localStorage so edits survive page reloads.
 */

var AmbientAdmin = AmbientAdmin || {};

AmbientAdmin.storage = (function () {
  var DRAFT_KEY = 'ambient-admin:draft';
  var VERSION_KEY = 'ambient-admin:draft-version';

  function getDraft() {
    try {
      var raw = localStorage.getItem(DRAFT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function saveDraft(config) {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(config));
    localStorage.setItem(VERSION_KEY, String(Date.now()));
    return true;
  }

  function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(VERSION_KEY);
  }

  function getDraftTimestamp() {
    var ts = localStorage.getItem(VERSION_KEY);
    return ts ? parseInt(ts, 10) : null;
  }

  return {
    getDraft: getDraft,
    saveDraft: saveDraft,
    clearDraft: clearDraft,
    getDraftTimestamp: getDraftTimestamp
  };
})();
