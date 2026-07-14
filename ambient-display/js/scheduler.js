/**
 * scheduler.js — Scene scheduler for Ambient Display
 *
 * Activates scenes (morning, day, evening, night) based on local device time.
 * Uses a single setTimeout per transition — no polling, no server. On scene
 * change the renderer is called fresh, destroying previous widgets.
 *
 * Designed for extension: emit() / on() hooks allow future event-based rules
 * (sunrise, calendar events, manual overrides) without rewriting the core.
 */

/* global AmbientDisplay */
var AmbientDisplay = AmbientDisplay || {};

AmbientDisplay.scheduler = (function () {
  var SCENE_IDS = ['morning', 'day', 'evening', 'night'];
  var DEFAULT_BOUNDARIES = {
    morning: '05:00',
    day: '09:00',
    evening: '17:00',
    night: '21:00'
  };

  var baseConfig = null;
  var normalizedScenes = [];
  var activeSceneId = null;
  var transitionTimer = null;
  var eventListeners = [];
  var visibilityBound = false;

  /**
   * Parse "HH:MM" into minutes since midnight.
   */
  function parseTimeString(timeStr) {
    var parts = String(timeStr).split(':');
    var hours = parseInt(parts[0], 10);
    var minutes = parseInt(parts[1], 10);

    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return 0;
    }

    return hours * 60 + minutes;
  }

  /**
   * Build a Date at a given minute offset on the same calendar day as refDate.
   */
  function dateAtMinutes(refDate, totalMinutes) {
    var result = new Date(refDate.getTime());
    var hours = Math.floor(totalMinutes / 60);
    var minutes = totalMinutes % 60;

    result.setHours(hours, minutes, 0, 0);
    return result;
  }

  /**
   * Return minutes since midnight for a Date (local device time).
   */
  function minutesNow(date) {
    return date.getHours() * 60 + date.getMinutes();
  }

  /**
   * Sort scenes chronologically by start time.
   */
  function sortScenes(scenes) {
    return scenes.slice().sort(function (a, b) {
      return a.startMinutes - b.startMinutes;
    });
  }

  /**
   * Resolve which scene is active at a given local time.
   */
  function resolveSceneAt(scenes, date) {
    var sorted = sortScenes(scenes);
    var nowMinutes = minutesNow(date);
    var active = sorted[sorted.length - 1];
    var i;

    for (i = 0; i < sorted.length; i++) {
      if (nowMinutes >= sorted[i].startMinutes) {
        active = sorted[i];
      }
    }

    return active;
  }

  /**
   * Compute the exact Date when the next scene boundary occurs.
   */
  function nextBoundaryDate(scenes, fromDate) {
    var sorted = sortScenes(scenes);
    var nowMinutes = minutesNow(fromDate);
    var i;
    var nextDay;

    for (i = 0; i < sorted.length; i++) {
      if (sorted[i].startMinutes > nowMinutes) {
        return dateAtMinutes(fromDate, sorted[i].startMinutes);
      }
    }

    /* All boundaries passed today — wrap to first scene tomorrow */
    nextDay = new Date(fromDate.getTime());
    nextDay.setDate(nextDay.getDate() + 1);
    return dateAtMinutes(nextDay, sorted[0].startMinutes);
  }

  /**
   * Milliseconds until the next scene boundary (minimum 1s to avoid tight loops).
   */
  function msUntilNextBoundary(scenes, fromDate) {
    var boundary = nextBoundaryDate(scenes, fromDate);
    var delay = boundary.getTime() - fromDate.getTime();

    if (delay < 1000) {
      return 1000;
    }

    return delay;
  }

  /**
   * Merge a scene definition with platform defaults from the root config.
   */
  function buildSceneRenderConfig(scene) {
    return {
      version: baseConfig.version,
      theme: scene.theme || baseConfig.theme,
      layout: scene.layout || baseConfig.layout,
      widgets: scene.widgets || baseConfig.widgets
    };
  }

  /**
   * Clear the pending transition timer.
   */
  function clearTransitionTimer() {
    if (transitionTimer !== null) {
      window.clearTimeout(transitionTimer);
      transitionTimer = null;
    }
  }

  /**
   * Dispatch an event to registered listeners (future event-based scheduling hook).
   */
  function emit(eventName, payload) {
    var i;
    var listener;

    for (i = 0; i < eventListeners.length; i++) {
      listener = eventListeners[i];

      if (listener.event === eventName && typeof listener.callback === 'function') {
        listener.callback(payload);
      }
    }
  }

  /**
   * Register a listener for scheduler events (e.g. "scene:change").
   */
  function on(eventName, callback) {
    if (!eventName || typeof callback !== 'function') {
      return false;
    }

    eventListeners.push({ event: eventName, callback: callback });
    return true;
  }

  /**
   * Activate a scene: apply theme, destroy old widgets, render new ones.
   */
  function activateScene(scene) {
    var renderConfig = buildSceneRenderConfig(scene);
    var previousSceneId = activeSceneId;

    AmbientDisplay.themeEngine.apply(renderConfig.theme);
    AmbientDisplay.render(renderConfig);

    activeSceneId = scene.id;

    if (previousSceneId !== null && previousSceneId !== scene.id) {
      emit('scene:change', {
        previous: previousSceneId,
        current: scene.id,
        scene: scene
      });
    }
  }

  /**
   * Check whether the active scene changed and act accordingly.
   */
  function evaluateScene() {
    var scene;

    if (!normalizedScenes.length) {
      return;
    }

    scene = resolveSceneAt(normalizedScenes, new Date());

    if (scene.id !== activeSceneId) {
      activateScene(scene);
    }
  }

  /**
   * Schedule a single timeout for the next boundary — no polling interval.
   */
  function scheduleNextTransition() {
    var delay;

    clearTransitionTimer();

    if (!normalizedScenes.length) {
      return;
    }

    delay = msUntilNextBoundary(normalizedScenes, new Date());

    transitionTimer = window.setTimeout(function () {
      evaluateScene();
      scheduleNextTransition();
    }, delay);
  }

  /**
   * Re-sync after the device wakes from sleep (Page Visibility API).
   */
  function handleVisibilityChange() {
    var hidden = document.hidden;

    if (hidden === undefined) {
      hidden = document.webkitHidden;
    }

    if (!hidden) {
      evaluateScene();
      scheduleNextTransition();
    }
  }

  /**
   * Bind visibility listener once to recover from sleep without polling.
   */
  function bindVisibilityHandler() {
    if (visibilityBound) {
      return;
    }

    if (document.addEventListener) {
      document.addEventListener('visibilitychange', handleVisibilityChange, false);
      visibilityBound = true;
    }
  }

  /**
   * Normalize raw scene entries from config.json.
   */
  function normalizeScenes(scenes, config) {
    var result = [];
    var source = Object.prototype.toString.call(scenes) === '[object Array]' ? scenes : [];
    var i;
    var raw;
    var id;
    var start;

    for (i = 0; i < source.length; i++) {
      raw = source[i];

      if (!raw || !raw.id) {
        continue;
      }

      id = String(raw.id).toLowerCase();
      start = raw.start || DEFAULT_BOUNDARIES[id] || '00:00';

      result.push({
        id: id,
        start: start,
        startMinutes: parseTimeString(start),
        theme: raw.theme || null,
        layout: raw.layout || null,
        widgets: Object.prototype.toString.call(raw.widgets) === '[object Array]' ? raw.widgets : null
      });
    }

    if (!result.length) {
      for (i = 0; i < SCENE_IDS.length; i++) {
        result.push({
          id: SCENE_IDS[i],
          start: DEFAULT_BOUNDARIES[SCENE_IDS[i]],
          startMinutes: parseTimeString(DEFAULT_BOUNDARIES[SCENE_IDS[i]]),
          theme: null,
          layout: null,
          widgets: null
        });
      }
    }

    return result;
  }

  /**
   * Start the scheduler with the loaded platform config.
   */
  function start(config) {
    var schedulerConfig = config.scheduler || {};

    baseConfig = config;

    if (!schedulerConfig.enabled) {
      AmbientDisplay.themeEngine.apply(config.theme);
      AmbientDisplay.render(config);
      return;
    }

    normalizedScenes = normalizeScenes(schedulerConfig.scenes, config);
    activeSceneId = null;

    activateScene(resolveSceneAt(normalizedScenes, new Date()));
    scheduleNextTransition();
    bindVisibilityHandler();
  }

  /**
   * Stop all scheduled transitions.
   */
  function stop() {
    clearTransitionTimer();
    activeSceneId = null;
    normalizedScenes = [];
    baseConfig = null;
  }

  /**
   * Return the id of the currently active scene, or null when idle.
   */
  function getActiveScene() {
    return activeSceneId;
  }

  return {
    start: start,
    stop: stop,
    getActiveScene: getActiveScene,
    on: on,
    emit: emit
  };
}());
