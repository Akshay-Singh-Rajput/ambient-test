/**
 * display-modes.js — Select display mode from content, phase, and config (ES5)
 */

/* global AmbientDisplay */
var AmbientDisplay = AmbientDisplay || {};

AmbientDisplay.displayModes = (function () {
  var DEFAULT_THRESHOLD = 80;

  function getConfig(config) {
    return config || (AmbientDisplay.configLoader ? AmbientDisplay.configLoader.getConfig() : null) || {};
  }

  function getModeConfig(config) {
    return getConfig(config).displayModes || {};
  }

  function isEnabled(config) {
    return getModeConfig(config).enabled !== false;
  }

  function getThreshold(config) {
    return getModeConfig(config).focusPriorityThreshold || DEFAULT_THRESHOLD;
  }

  function isCelebrationItem(item, celebrationTypes) {
    var payload;
    var kind;
    var i;

    if (!item || !item.hasContent) {
      return false;
    }

    payload = item.payload || {};

    if (payload.emphasis === 'celebratory') {
      return true;
    }

    if (item.id === 'agenda') {
      kind = payload.kind || '';
      for (i = 0; i < celebrationTypes.length; i++) {
        if (celebrationTypes[i] === kind) {
          return true;
        }
      }
    }

    if (item.id === 'personalMessage' && (payload.scope === 'birthday' || payload.scope === 'custom')) {
      return true;
    }

    return false;
  }

  function hasCelebration(items, config) {
    var types = getModeConfig(config).celebrationTypes || ['birthday', 'anniversary', 'festival'];
    var i;

    for (i = 0; i < items.length; i++) {
      if (isCelebrationItem(items[i], types)) {
        return true;
      }
    }

    return false;
  }

  function hasImportantContent(items, threshold) {
    var i;

    for (i = 0; i < items.length; i++) {
      if (items[i].canBeHero && items[i].priority >= threshold) {
        if (!isCelebrationItem(items[i], ['birthday', 'anniversary', 'festival'])) {
          return true;
        }
      }
    }

    return false;
  }

  function hasModerateContent(items, threshold) {
    var i;

    for (i = 0; i < items.length; i++) {
      if (items[i].priority >= 50 && items[i].priority < threshold) {
        return true;
      }
    }

    return false;
  }

  function getModeFlags(mode, config) {
    var flags = {
      pausePhotoRotation: false,
      reduceAnimations: false,
      largeClock: false,
      hideContext: false,
      hideAmbient: false,
      hideStage: false,
      intentClockLayout: false,
      contextLimit: 3,
      ambientRotationMs: null,
      minimalRefresh: false
    };

    if (mode === 'prepare') {
      return AmbientDisplay.nightClock.getModeFlags(config, 'prepare');
    }

    if (mode === 'bedside') {
      return AmbientDisplay.nightClock.getModeFlags(config, 'bedside');
    }

    if (mode === 'calm') {
      flags.largeClock = true;
      flags.contextLimit = 1;
      return flags;
    }

    if (mode === 'quiet') {
      flags.reduceAnimations = true;
      flags.contextLimit = 1;
      flags.pausePhotoRotation = true;
      return flags;
    }

    if (mode === 'celebration') {
      flags.contextLimit = 1;
      return flags;
    }

    return flags;
  }

  function select(items, now, config) {
    var cfg = getConfig(config);
    var threshold = getThreshold(cfg);
    var wakeProgress = AmbientDisplay.nightClock.getWakeProgress(now, cfg);
    var intentPhase = AmbientDisplay.nightClock.getActiveIntentPhase(now, cfg);
    var modeId = 'standard';
    var flags;

    if (!isEnabled(cfg)) {
      return { id: 'standard', flags: getModeFlags('standard', cfg), wakeProgress: -1 };
    }

    if (hasCelebration(items, cfg)) {
      modeId = 'celebration';
    } else if (!intentPhase && hasImportantContent(items, threshold)) {
      modeId = 'focus';
    } else if (intentPhase === 'prepare' && AmbientDisplay.nightClock.isEnabled(cfg)) {
      modeId = 'prepare';
    } else if (intentPhase === 'bedside' && AmbientDisplay.nightClock.isEnabled(cfg)) {
      modeId = 'bedside';
    } else if (wakeProgress >= 0 && wakeProgress < 1) {
      modeId = 'quiet';
    } else if (!hasModerateContent(items, threshold)) {
      modeId = 'calm';
    }

    flags = getModeFlags(modeId, cfg);

    if (modeId === 'quiet') {
      flags.wakeProgress = wakeProgress;
    }

    return {
      id: modeId,
      flags: flags,
      wakeProgress: wakeProgress
    };
  }

  return {
    select: select,
    getModeFlags: getModeFlags
  };
})();
