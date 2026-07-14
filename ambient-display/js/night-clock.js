/**
 * night-clock.js — Prepare & Bedside intent modes (ES5)
 */

/* global AmbientDisplay */
var AmbientDisplay = AmbientDisplay || {};

AmbientDisplay.nightClock = (function () {
  var BG_PREFIX = 'ambient-night-bg-';
  var CRITICAL_KINDS = ['appointment', 'deadline', 'interview', 'travel', 'flight', 'reminder', 'birthday'];

  function getLegacyConfig(config) {
    return (config && config.nightClock) ? config.nightClock : {};
  }

  function getIntentConfig(config) {
    var intent = config && config.intentPhases ? config.intentPhases : {};
    var legacy = getLegacyConfig(config);

    return {
      enabled: intent.enabled !== false && legacy.enabled !== false,
      prepareStart: (intent.prepare && intent.prepare.startTime) || legacy.prepareStartTime || '21:00',
      prepareEnd: (intent.prepare && intent.prepare.endTime) || legacy.prepareEndTime || '00:00',
      bedsideStart: (intent.bedside && intent.bedside.startTime) || legacy.startTime || '00:00',
      bedsideEnd: (intent.bedside && intent.bedside.endTime) || legacy.endTime || '06:00',
      earlyMorningCutoff: intent.earlyMorningCutoff || legacy.earlyMorningCutoff || '08:00',
      tomorrowPriorityThreshold: intent.tomorrowPriorityThreshold || legacy.tomorrowPriorityThreshold || 60,
      bedsideReminderThreshold: intent.bedsideReminderThreshold || legacy.bedsideReminderThreshold || 80,
      wakeTransitionStart: intent.wakeTransitionStart || legacy.wakeTransitionStart || '05:30',
      wakeTransitionEnd: intent.wakeTransitionEnd || legacy.wakeTransitionEnd || '06:30',
      background: (intent.background || legacy.background || 'dark-gradient'),
      personalMessage: intent.personalMessage || legacy.personalMessage || 'Sleep well \u2764\uFE0F',
      prepareMessage: intent.prepareMessage || legacy.prepareMessage || null,
      pauseAmbientRotation: intent.pauseAmbientRotation !== false && legacy.pauseAmbientRotation !== false,
      pausePhotoRotation: intent.pausePhotoRotation !== false && legacy.pausePhotoRotation !== false,
      pauseQuoteRotation: intent.pauseQuoteRotation !== false && legacy.pauseQuoteRotation !== false,
      reduceAnimations: intent.reduceAnimations !== false && legacy.reduceAnimations !== false,
      showSeconds: intent.showSeconds !== false && legacy.showSeconds !== false,
      clockScale: intent.clockScale || legacy.clockScale || 0.7
    };
  }

  function isEnabled(config) {
    return getIntentConfig(config).enabled;
  }

  function isPrepareActive(now, config) {
    var cfg = getIntentConfig(config);

    if (!cfg.enabled) {
      return false;
    }

    return AmbientDisplay.dayPhase.isWithinWindow(now, cfg.prepareStart, cfg.prepareEnd);
  }

  function isBedsideActive(now, config) {
    var cfg = getIntentConfig(config);

    if (!cfg.enabled) {
      return false;
    }

    return AmbientDisplay.dayPhase.isWithinWindow(now, cfg.bedsideStart, cfg.bedsideEnd);
  }

  function getActiveIntentPhase(now, config) {
    var override = AmbientDisplay.previewMode && AmbientDisplay.previewMode.getIntentOverride();

    if (override) {
      return override;
    }

    if (isPrepareActive(now, config)) {
      return 'prepare';
    }
    if (isBedsideActive(now, config)) {
      return 'bedside';
    }
    return null;
  }

  function isNightActive(now, config) {
    return getActiveIntentPhase(now, config) !== null;
  }

  function collectScheduleItems(config) {
    var items = [];
    var agenda = config && config.agenda && config.agenda.items ? config.agenda.items : [];
    var events = config && config.calendar && config.calendar.events ? config.calendar.events : [];
    var i;

    for (i = 0; i < agenda.length; i++) {
      items.push(agenda[i]);
    }

    for (i = 0; i < events.length; i++) {
      items.push({
        type: 'appointment',
        title: events[i].title,
        date: events[i].date,
        time: events[i].time || null
      });
    }

    return items;
  }

  function tomorrowPriority(item, now) {
    var u = AmbientDisplay.providerUtils;
    var days = u.daysUntil(item.date, now);
    var type = item.type || 'reminder';

    if (days !== 1) {
      return 0;
    }

    if (type === 'flight' || type === 'travel' || type === 'interview') {
      return 95;
    }
    if (type === 'deadline') {
      return 92;
    }
    if (type === 'appointment') {
      return 88;
    }
    if (type === 'birthday' || type === 'anniversary') {
      return 85;
    }
    if (type === 'reminder') {
      return 70;
    }

    return 65;
  }

  function isEventBeforeCutoff(timeValue, cutoffTime) {
    var eventMinutes;
    var cutoffMinutes;

    if (!timeValue) {
      return true;
    }

    eventMinutes = AmbientDisplay.dayPhase.parseTimeToMinutes(timeValue);
    cutoffMinutes = AmbientDisplay.dayPhase.parseTimeToMinutes(cutoffTime);
    return eventMinutes < cutoffMinutes;
  }

  function compareByTime(a, b) {
    var aMinutes = AmbientDisplay.dayPhase.parseTimeToMinutes(a.time || '99:99');
    var bMinutes = AmbientDisplay.dayPhase.parseTimeToMinutes(b.time || '99:99');
    return aMinutes - bMinutes;
  }

  function buildSchedulePayload(item, now) {
    var type = item.type || 'reminder';

    return {
      kind: type,
      title: item.title,
      subtitle: item.time ? 'Tomorrow \u00B7 ' + item.time : 'Tomorrow',
      time: item.time || null,
      emphasis: type === 'deadline' ? 'warning' : 'normal'
    };
  }

  function pickTomorrowSummary(config, now, threshold) {
    var items = collectScheduleItems(config);
    var best = null;
    var bestPriority = 0;
    var i;
    var priority;

    for (i = 0; i < items.length; i++) {
      priority = tomorrowPriority(items[i], now);
      if (priority >= threshold && priority > bestPriority) {
        bestPriority = priority;
        best = items[i];
      }
    }

    if (!best) {
      return null;
    }

    return {
      id: 'agenda',
      hasContent: true,
      priority: bestPriority,
      regionPreference: 'corner',
      canBeHero: false,
      canRotate: false,
      payload: buildSchedulePayload(best, now)
    };
  }

  function pickBedsideReminders(config, now, threshold, cutoffTime) {
    var items = collectScheduleItems(config);
    var reminders = [];
    var i;
    var priority;

    for (i = 0; i < items.length; i++) {
      priority = tomorrowPriority(items[i], now);
      if (priority < threshold) {
        continue;
      }
      if (!isEventBeforeCutoff(items[i].time, cutoffTime)) {
        continue;
      }
      reminders.push({
        id: 'agenda',
        hasContent: true,
        priority: priority,
        regionPreference: 'corner',
        canBeHero: false,
        canRotate: false,
        payload: buildSchedulePayload(items[i], now)
      });
    }

    reminders.sort(function (a, b) {
      return compareByTime(a.payload, b.payload);
    });

    return reminders.slice(0, 3);
  }

  function kindEmoji(kind, title) {
    var lowerTitle = String(title || '').toLowerCase();
    var lowerKind = String(kind || '').toLowerCase();

    if (lowerKind === 'flight' || lowerKind === 'travel' || lowerTitle.indexOf('flight') !== -1) {
      return '\u2708';
    }
    if (lowerTitle.indexOf('dentist') !== -1 || lowerTitle.indexOf('doctor') !== -1) {
      return '\uD83E\uDDB7';
    }
    if (lowerKind === 'birthday') {
      return '\uD83C\uDF82';
    }
    if (lowerKind === 'deadline') {
      return '\u23F0';
    }
    if (lowerKind === 'appointment') {
      return '\uD83D\uDCC5';
    }
    return '\u2022';
  }

  function findNightPersonalMessage(items) {
    var i;
    var payload;

    for (i = 0; i < items.length; i++) {
      if (items[i].id === 'personalMessage' && items[i].hasContent) {
        payload = items[i].payload || {};
        if (payload.scope === 'night') {
          return payload.text;
        }
      }
    }

    return null;
  }

  function getPrepareMessage(config, items) {
    var cfg = getIntentConfig(config);
    var message = findNightPersonalMessage(items);

    if (message) {
      return message;
    }

    if (cfg.prepareMessage) {
      return cfg.prepareMessage;
    }

    return 'Plan for tomorrow, then rest well \u2764\uFE0F';
  }

  function getWakeProgress(now, config) {
    var cfg = getIntentConfig(config);
    var start = cfg.wakeTransitionStart;
    var end = cfg.wakeTransitionEnd;
    var current;
    var startMin;
    var endMin;
    var duration;
    var elapsed;

    current = AmbientDisplay.dayPhase.minutesNow(now);
    startMin = AmbientDisplay.dayPhase.parseTimeToMinutes(start);
    endMin = AmbientDisplay.dayPhase.parseTimeToMinutes(end);

    if (endMin <= startMin) {
      return -1;
    }

    if (current < startMin || current >= endMin) {
      return current >= endMin ? 1 : -1;
    }

    duration = endMin - startMin;
    elapsed = current - startMin;
    return elapsed / duration;
  }

  function applyBackground(config) {
    var cfg = getIntentConfig(config);
    var bg = cfg.background || 'dark-gradient';
    var html = document.documentElement;
    var types = ['pure-black', 'dark-gradient', 'blurred-photo', 'static-night'];
    var i;
    var cls;

    for (i = 0; i < types.length; i++) {
      cls = BG_PREFIX + types[i];
      if (html.classList) {
        html.classList.remove(cls);
      }
    }

    cls = BG_PREFIX + bg.replace(/[^a-z-]/g, '');
    if (html.classList) {
      html.classList.add(cls);
    } else {
      html.className = (html.className + ' ' + cls).replace(/\s+/g, ' ');
    }

    if (bg === 'blurred-photo') {
      applyBlurredPhoto(config);
    } else {
      clearBlurredPhoto();
    }
  }

  function applyBlurredPhoto(config) {
    var photos = config && config.photos && config.photos.items ? config.photos.items : [];
    var html = document.documentElement;
    var src;

    if (!photos.length) {
      return;
    }

    src = photos[0].src;
    html.style.backgroundImage = 'url(' + src + ')';
    html.style.backgroundSize = 'cover';
    html.style.backgroundPosition = 'center';
  }

  function clearBlurredPhoto() {
    document.documentElement.style.backgroundImage = '';
    document.documentElement.style.backgroundSize = '';
    document.documentElement.style.backgroundPosition = '';
  }

  function clearBackground() {
    var html = document.documentElement;
    var types = ['pure-black', 'dark-gradient', 'blurred-photo', 'static-night'];
    var i;

    for (i = 0; i < types.length; i++) {
      if (html.classList) {
        html.classList.remove(BG_PREFIX + types[i]);
      }
    }
    clearBlurredPhoto();
  }

  function sharedIntentFlags(config) {
    var cfg = getIntentConfig(config);

    return {
      pausePhotoRotation: cfg.pausePhotoRotation !== false,
      pauseQuoteRotation: cfg.pauseQuoteRotation !== false,
      pauseAmbientRotation: cfg.pauseAmbientRotation !== false,
      reduceAnimations: cfg.reduceAnimations !== false,
      hideContext: true,
      hideAmbient: true,
      hideStage: true,
      minimalRefresh: true,
      contextLimit: 0,
      intentClockLayout: true,
      showDate: true,
      showWeekday: false
    };
  }

  function getPrepareFlags(config) {
    var flags = sharedIntentFlags(config);

    flags.largeClock = true;
    flags.showGreeting = true;
    flags.showPersonalMessage = true;
    flags.intentLayout = 'prepare';
    return flags;
  }

  function getBedsideFlags(config) {
    var flags = sharedIntentFlags(config);

    flags.largeClock = true;
    flags.showGreeting = false;
    flags.showPersonalMessage = false;
    flags.intentLayout = 'bedside';
    return flags;
  }

  function getModeFlags(config, mode) {
    if (mode === 'prepare') {
      return getPrepareFlags(config);
    }
    return getBedsideFlags(config);
  }

  return {
    isEnabled: isEnabled,
    isPrepareActive: isPrepareActive,
    isBedsideActive: isBedsideActive,
    getActiveIntentPhase: getActiveIntentPhase,
    isNightActive: isNightActive,
    getIntentConfig: getIntentConfig,
    pickTomorrowSummary: pickTomorrowSummary,
    pickBedsideReminders: pickBedsideReminders,
    kindEmoji: kindEmoji,
    getPrepareMessage: getPrepareMessage,
    getWakeProgress: getWakeProgress,
    applyBackground: applyBackground,
    clearBackground: clearBackground,
    getModeFlags: getModeFlags
  };
})();
