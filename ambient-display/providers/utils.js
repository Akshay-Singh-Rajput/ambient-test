/**
 * providers/utils.js — Shared helpers for content providers (ES5)
 */

/* global AmbientDisplay */
var AmbientDisplay = AmbientDisplay || {};

AmbientDisplay.providerUtils = (function () {
  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function parseDateValue(value, now) {
    var lower = String(value).toLowerCase();
    var parts;
    var y;
    var m;
    var d;

    if (lower === 'today') {
      return startOfDay(now);
    }
    if (lower === 'tomorrow') {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    }

    parts = String(value).split('-');
    if (parts.length === 3) {
      y = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10) - 1;
      d = parseInt(parts[2], 10);
      return new Date(y, m, d);
    }

    return null;
  }

  function daysUntil(dateValue, now) {
    var target = parseDateValue(dateValue, now);
    if (!target) {
      return 9999;
    }
    return Math.floor((startOfDay(target).getTime() - startOfDay(now).getTime()) / 86400000);
  }

  function isSameDay(dateValue, now) {
    return daysUntil(dateValue, now) === 0;
  }

  function dayIndex(date) {
    return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  }

  function greetingForPhase(phase) {
    if (phase === 'morning') {
      return 'Good Morning';
    }
    if (phase === 'afternoon') {
      return 'Good Afternoon';
    }
    if (phase === 'evening') {
      return 'Good Evening';
    }
    return 'Good Night';
  }

  function greetingEmoji(phase) {
    if (phase === 'morning') {
      return ' \u2600\uFE0F';
    }
    if (phase === 'evening') {
      return ' \uD83C\uDF07';
    }
    if (phase === 'night') {
      return ' \uD83C\uDF19';
    }
    return '';
  }

  function makeContent(opts) {
    return {
      id: opts.id,
      hasContent: opts.hasContent !== false,
      priority: opts.priority || 0,
      regionPreference: opts.regionPreference || 'ambient',
      canBeHero: opts.canBeHero === true,
      canRotate: opts.canRotate === true,
      refreshInterval: opts.refreshInterval || 300000,
      payload: opts.payload || null
    };
  }

  function emptyContent(id, refreshInterval) {
    return makeContent({
      id: id,
      hasContent: false,
      priority: 0,
      regionPreference: 'ambient',
      canBeHero: false,
      canRotate: false,
      refreshInterval: refreshInterval || 300000,
      payload: null
    });
  }

  return {
    pad: pad,
    startOfDay: startOfDay,
    parseDateValue: parseDateValue,
    daysUntil: daysUntil,
    isSameDay: isSameDay,
    dayIndex: dayIndex,
    greetingForPhase: greetingForPhase,
    greetingEmoji: greetingEmoji,
    makeContent: makeContent,
    emptyContent: emptyContent
  };
})();
