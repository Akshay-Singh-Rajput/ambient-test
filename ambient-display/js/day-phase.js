/**
 * day-phase.js — Detect current day phase for theme and greeting (ES5)
 */

/* global AmbientDisplay */
var AmbientDisplay = AmbientDisplay || {};

AmbientDisplay.dayPhase = (function () {
  function getCurrentPhase(now) {
    var date = now || new Date();
    var hour = date.getHours();

    if (hour >= 6 && hour <= 11) {
      return 'morning';
    }
    if (hour >= 12 && hour <= 16) {
      return 'afternoon';
    }
    if (hour >= 17 && hour <= 20) {
      return 'evening';
    }
    return 'night';
  }

  return {
    getCurrentPhase: getCurrentPhase
  };
})();
