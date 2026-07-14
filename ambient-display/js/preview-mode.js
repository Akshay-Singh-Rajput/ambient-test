/**
 * preview-mode.js — URL overrides for local intent-phase testing (ES5)
 */

/* global AmbientDisplay */
var AmbientDisplay = AmbientDisplay || {};

AmbientDisplay.previewMode = (function () {
  var INTENT_OVERRIDES = { prepare: true, bedside: true };

  function readPreviewParam() {
    var search = window.location.search || '';
    var match = search.match(/[?&]preview=([^&]+)/);
    return match ? decodeURIComponent(match[1]).toLowerCase() : null;
  }

  function getIntentOverride() {
    var value = readPreviewParam();
    return INTENT_OVERRIDES[value] ? value : null;
  }

  function isAdminPreview() {
    return readPreviewParam() === '1';
  }

  return {
    getIntentOverride: getIntentOverride,
    isAdminPreview: isAdminPreview
  };
})();
