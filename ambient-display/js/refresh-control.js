/**
 * refresh-control.js — Status time and manual refresh for Ambient Display
 *
 * Shows device time with seconds and a refresh control on the kiosk UI.
 * Hidden in admin preview mode (?preview=1) so the iframe matches a clean view.
 */

/* global AmbientDisplay */
(function () {
  var TICK_MS = 1000;
  var statusEl = null;
  var tickTimer = null;

  function isPreviewMode() {
    return window.location.search.indexOf('preview=1') !== -1;
  }

  function pad(value) {
    return value < 10 ? '0' + value : String(value);
  }

  function formatStatusTime(date) {
    return pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
  }

  function tickStatusTime() {
    if (statusEl) {
      statusEl.textContent = formatStatusTime(new Date());
    }
  }

  function buildControls() {
    var bar = document.createElement('div');
    bar.className = 'ambient-controls';
    bar.setAttribute('role', 'toolbar');
    bar.setAttribute('aria-label', 'Display controls');

    statusEl = document.createElement('time');
    statusEl.className = 'ambient-controls__clock';
    statusEl.setAttribute('datetime', new Date().toISOString());
    tickStatusTime();

    var refreshBtn = document.createElement('button');
    refreshBtn.type = 'button';
    refreshBtn.className = 'ambient-controls__refresh';
    refreshBtn.setAttribute('aria-label', 'Refresh display');
    refreshBtn.innerHTML =
      '<svg class="ambient-controls__icon" viewBox="0 0 24 24" aria-hidden="true">' +
      '<path fill="currentColor" d="M17.65 6.35A7.96 7.96 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08a5.99 5.99 0 0 1-5.65 4c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>' +
      '</svg>';

    refreshBtn.addEventListener('click', function () {
      window.location.reload();
    });

    bar.appendChild(statusEl);
    bar.appendChild(refreshBtn);
    document.body.appendChild(bar);

    tickTimer = window.setInterval(tickStatusTime, TICK_MS);
  }

  if (!isPreviewMode()) {
    if (document.addEventListener) {
      document.addEventListener('DOMContentLoaded', buildControls, false);
    } else {
      window.onload = buildControls;
    }
  }
}());
