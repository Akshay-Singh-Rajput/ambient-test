/**
 * presentation-rules.js — Curate content by display mode (ES5)
 */

/* global AmbientDisplay */
var AmbientDisplay = AmbientDisplay || {};

AmbientDisplay.presentationRules = (function () {
  function findById(items, id) {
    var i;
    for (i = 0; i < items.length; i++) {
      if (items[i].id === id) {
        return items[i];
      }
    }
    return null;
  }

  function isUsed(item, hero, context) {
    var i;

    if (hero && hero.id === item.id) {
      return true;
    }

    for (i = 0; i < context.length; i++) {
      if (context[i].id === item.id) {
        return true;
      }
    }

    return false;
  }

  function cloneAsHero(item) {
    return {
      id: item.id,
      hasContent: true,
      priority: item.priority,
      regionPreference: 'hero',
      canBeHero: true,
      canRotate: false,
      refreshInterval: item.refreshInterval,
      payload: item.payload,
      fallback: true
    };
  }

  function pickImportantHero(items, threshold) {
    var i;
    for (i = 0; i < items.length; i++) {
      if (items[i].canBeHero && items[i].priority >= threshold) {
        return items[i];
      }
    }
    return null;
  }

  function pickNightReminder(items, threshold) {
    var best = null;
    var i;

    for (i = 0; i < items.length; i++) {
      if (items[i].id === 'agenda' && items[i].hasContent && items[i].priority >= 80) {
        if (!best || items[i].priority > best.priority) {
          best = items[i];
        }
      }
    }

    if (best) {
      return best;
    }

    return pickImportantHero(items, threshold);
  }

  function pickCelebrationHero(items) {
    var message = findById(items, 'personalMessage');
    var agenda = findById(items, 'agenda');
    var photo = findById(items, 'photo');

    if (message && message.canBeHero) {
      return message;
    }
    if (agenda && agenda.payload && agenda.payload.emphasis === 'celebratory') {
      return agenda;
    }
    if (photo) {
      return cloneAsHero(photo);
    }
    return message ? cloneAsHero(message) : null;
  }

  function pickCalmHero(items) {
    var photo = findById(items, 'photo');
    var message = findById(items, 'personalMessage');

    if (photo) {
      return cloneAsHero(photo);
    }
    if (message && message.hasContent) {
      return cloneAsHero(message);
    }
    return null;
  }

  function pickDefaultHero(items) {
    var photo = findById(items, 'photo');
    var message = findById(items, 'personalMessage');
    var i;

    for (i = 0; i < items.length; i++) {
      if (items[i].canBeHero && items[i].priority >= 80) {
        return items[i];
      }
    }

    if (message && message.canBeHero) {
      return message;
    }
    if (photo) {
      return cloneAsHero(photo);
    }
    if (message && message.hasContent) {
      return cloneAsHero(message);
    }

    return null;
  }

  function pickContext(items, hero, limit, preferWeather) {
    var context = [];
    var weather = findById(items, 'weather');
    var i;
    var item;

    if (limit === 0) {
      return context;
    }

    if (preferWeather && weather && !isUsed(weather, hero, context)) {
      context.push(weather);
    }

    for (i = 0; i < items.length && context.length < limit; i++) {
      item = items[i];
      if (isUsed(item, hero, context)) {
        continue;
      }
      if (item.regionPreference === 'context') {
        context.push(item);
      }
    }

    return context;
  }

  function pickAmbient(items, hero, context, flags) {
    var ambient = [];
    var i;
    var item;

    if (flags.hideAmbient || flags.pauseAmbientRotation) {
      return ambient;
    }

    for (i = 0; i < items.length; i++) {
      item = items[i];
      if (isUsed(item, hero, context)) {
        continue;
      }
      if (flags.pausePhotoRotation && item.id === 'photo') {
        continue;
      }
      if (flags.pauseQuoteRotation && item.id === 'quote') {
        continue;
      }
      if (item.canRotate || item.regionPreference === 'ambient') {
        ambient.push(item);
      }
    }

    return ambient;
  }

  function resolveEmphasis(displayModeId, hero) {
    if (displayModeId === 'celebration') {
      return 'celebratory';
    }
    if (!hero || !hero.payload) {
      return 'normal';
    }
    if (hero.payload.emphasis === 'warning') {
      return 'warning';
    }
    if (hero.payload.emphasis === 'celebratory') {
      return 'celebratory';
    }
    return 'normal';
  }

  function apply(items, displayMode, config, now) {
    var modeId = displayMode.id || 'standard';
    var flags = displayMode.flags || AmbientDisplay.displayModes.getModeFlags(modeId, config);
    var threshold = 80;
    var hero = null;
    var reminder = null;
    var context = [];
    var ambient = [];
    var nightMessage = null;
    var prepareMessage = null;
    var tomorrowSummary = null;
    var bedsideReminders = [];
    var intentCfg;
    var current = now || new Date();
    var wakeProgress = displayMode.wakeProgress;

    if (config && config.displayModes && config.displayModes.focusPriorityThreshold) {
      threshold = config.displayModes.focusPriorityThreshold;
    }

    if (modeId === 'prepare') {
      intentCfg = AmbientDisplay.nightClock.getIntentConfig(config);
      tomorrowSummary = AmbientDisplay.nightClock.pickTomorrowSummary(
        config,
        current,
        intentCfg.tomorrowPriorityThreshold
      );
      prepareMessage = AmbientDisplay.nightClock.getPrepareMessage(config, items);
      return {
        displayMode: modeId,
        flags: flags,
        hero: null,
        reminder: null,
        tomorrowSummary: tomorrowSummary,
        bedsideReminders: [],
        context: [],
        ambient: [],
        nightMessage: null,
        prepareMessage: prepareMessage,
        wakeProgress: wakeProgress,
        emphasis: 'normal'
      };
    }

    if (modeId === 'bedside') {
      intentCfg = AmbientDisplay.nightClock.getIntentConfig(config);
      bedsideReminders = AmbientDisplay.nightClock.pickBedsideReminders(
        config,
        current,
        intentCfg.bedsideReminderThreshold,
        intentCfg.earlyMorningCutoff
      );
      return {
        displayMode: modeId,
        flags: flags,
        hero: null,
        reminder: null,
        tomorrowSummary: null,
        bedsideReminders: bedsideReminders,
        context: [],
        ambient: [],
        nightMessage: null,
        prepareMessage: null,
        wakeProgress: wakeProgress,
        emphasis: 'normal'
      };
    }

    if (modeId === 'celebration') {
      hero = pickCelebrationHero(items);
      context = pickContext(items, hero, flags.contextLimit, false);
      ambient = pickAmbient(items, hero, context, flags);
    } else if (modeId === 'focus') {
      hero = pickImportantHero(items, threshold) || pickDefaultHero(items);
      context = pickContext(items, hero, flags.contextLimit, false);
      ambient = pickAmbient(items, hero, context, flags);
    } else if (modeId === 'calm') {
      hero = pickCalmHero(items);
      context = pickContext(items, hero, flags.contextLimit, true);
      ambient = pickAmbient(items, hero, context, flags);
    } else if (modeId === 'quiet') {
      hero = pickDefaultHero(items);
      context = pickContext(items, hero, 1, true);
      ambient = pickAmbient(items, hero, context, flags);
    } else {
      hero = pickDefaultHero(items);
      context = pickContext(items, hero, flags.contextLimit, false);
      ambient = pickAmbient(items, hero, context, flags);
    }

    if (flags.hideContext) {
      context = [];
    }

    return {
      displayMode: modeId,
      flags: flags,
      hero: hero,
      reminder: reminder,
      tomorrowSummary: tomorrowSummary,
      bedsideReminders: bedsideReminders,
      context: context,
      ambient: ambient,
      nightMessage: nightMessage,
      prepareMessage: prepareMessage,
      wakeProgress: wakeProgress,
      emphasis: resolveEmphasis(modeId, hero)
    };
  }

  return {
    apply: apply
  };
})();
