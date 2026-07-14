/**
 * day-phase.js — User-intent phases and time window helpers (ES5)
 */

/* global AmbientDisplay */
var AmbientDisplay = AmbientDisplay || {};

AmbientDisplay.dayPhase = (function () {
  function parseTimeToMinutes(value) {
    var parts;
    var h;
    var m;

    if (!value) {
      return 0;
    }

    parts = String(value).split(':');
    h = parseInt(parts[0], 10);
    m = parts.length > 1 ? parseInt(parts[1], 10) : 0;

    if (isNaN(h) || isNaN(m)) {
      return 0;
    }

    return h * 60 + m;
  }

  function minutesNow(date) {
    return date.getHours() * 60 + date.getMinutes();
  }

  function isWithinWindow(now, startTime, endTime) {
    var current = minutesNow(now);
    var start = parseTimeToMinutes(startTime);
    var end = parseTimeToMinutes(endTime);

    if (start === end) {
      return false;
    }

    if (start < end) {
      return current >= start && current < end;
    }

    return current >= start || current < end;
  }

  function getIntentWindows(config) {
    var intent = config && config.intentPhases ? config.intentPhases : {};
    var legacy = config && config.nightClock ? config.nightClock : {};
    var prepare = intent.prepare || {};
    var bedside = intent.bedside || {};

    return {
      prepareStart: prepare.startTime || legacy.prepareStartTime || '21:00',
      prepareEnd: prepare.endTime || legacy.prepareEndTime || '00:00',
      bedsideStart: bedside.startTime || legacy.startTime || '00:00',
      bedsideEnd: bedside.endTime || legacy.endTime || '06:00'
    };
  }

  function getIntentPhase(now, config) {
    var windows = getIntentWindows(config);
    var date = now || new Date();

    if (isWithinWindow(date, windows.prepareStart, windows.prepareEnd)) {
      return 'prepare';
    }

    if (isWithinWindow(date, windows.bedsideStart, windows.bedsideEnd)) {
      return 'bedside';
    }

    return null;
  }

  function getCurrentPhase(now, config) {
    var date = now || new Date();
    var hour = date.getHours();
    var intent = getIntentPhase(date, config);
    var override = AmbientDisplay.previewMode && AmbientDisplay.previewMode.getIntentOverride();

    if (override) {
      return override;
    }

    if (intent === 'prepare') {
      return 'prepare';
    }

    if (intent === 'bedside') {
      return 'bedside';
    }

    if (hour >= 6 && hour <= 11) {
      return 'morning';
    }
    if (hour >= 12 && hour <= 16) {
      return 'afternoon';
    }
    if (hour >= 17 && hour <= 20) {
      return 'evening';
    }

    return 'evening';
  }

  function getThemePhase(now, config) {
    var phase = getCurrentPhase(now, config);

    if (phase === 'prepare' || phase === 'bedside') {
      return 'night';
    }

    return phase;
  }

  return {
    getCurrentPhase: getCurrentPhase,
    getIntentPhase: getIntentPhase,
    getThemePhase: getThemePhase,
    getIntentWindows: getIntentWindows,
    parseTimeToMinutes: parseTimeToMinutes,
    minutesNow: minutesNow,
    isWithinWindow: isWithinWindow
  };
})();
