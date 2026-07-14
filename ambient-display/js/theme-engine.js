/**
 * theme-engine.js — Phase-based theme with smooth CSS transitions (ES5)
 */

/* global AmbientDisplay */
var AmbientDisplay = AmbientDisplay || {};

AmbientDisplay.themeEngine = (function () {
  var PHASES = ['morning', 'afternoon', 'evening', 'night'];
  var CLASS_PREFIX = 'phase-';
  var activePhase = null;
  var checkTimer = null;

  function removeClass(element, className) {
    var pattern = new RegExp('(^|\\s)' + className + '(\\s|$)', 'g');
    element.className = element.className.replace(pattern, ' ').replace(/\s+/g, ' ').replace(/^\s|\s$/g, '');
  }

  function clearPhaseClasses(element) {
    var i;
    for (i = 0; i < PHASES.length; i++) {
      if (element.classList) {
        element.classList.remove(CLASS_PREFIX + PHASES[i]);
      } else {
        removeClass(element, CLASS_PREFIX + PHASES[i]);
      }
    }
  }

  function applyPhase(phase) {
    var html = document.documentElement;
    var body = document.body;
    var phaseClass = CLASS_PREFIX + phase;

    if (activePhase === phase) {
      return phase;
    }

    clearPhaseClasses(html);
    clearPhaseClasses(body);

    if (html.classList) {
      html.classList.add(phaseClass);
    } else {
      html.className = (html.className + ' ' + phaseClass).replace(/\s+/g, ' ');
    }

    if (body.classList) {
      body.classList.add(phaseClass);
    } else {
      body.className = (body.className + ' ' + phaseClass).replace(/\s+/g, ' ');
    }

    activePhase = phase;
    return phase;
  }

  function update(now) {
    var phase = AmbientDisplay.dayPhase.getCurrentPhase(now || new Date());
    return applyPhase(phase);
  }

  function startAutoUpdate() {
    if (checkTimer) {
      window.clearInterval(checkTimer);
    }
    update(new Date());
    checkTimer = window.setInterval(function () {
      update(new Date());
    }, 60000);
  }

  function stopAutoUpdate() {
    if (checkTimer) {
      window.clearInterval(checkTimer);
      checkTimer = null;
    }
    activePhase = null;
  }

  function getActivePhase() {
    return activePhase;
  }

  return {
    applyPhase: applyPhase,
    update: update,
    startAutoUpdate: startAutoUpdate,
    stopAutoUpdate: stopAutoUpdate,
    getActivePhase: getActivePhase
  };
})();
