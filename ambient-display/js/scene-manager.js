/**
 * scene-manager.js — Scene Manager for Ambient Display (ES5)
 *
 * Owns all scenes, activates exactly one at a time, and handles schedule/duration
 * transitions. The renderer only calls getCurrentScene() — never reads cards.
 */

/* global AmbientDisplay */
var AmbientDisplay = AmbientDisplay || {};

AmbientDisplay.sceneManager = (function () {
  var scenes = [];
  var sceneMap = {};
  var currentScene = null;
  var currentSceneId = null;
  var mountRoot = null;
  var scheduleTimer = null;
  var durationTimer = null;
  var forcedSceneId = null;
  var visibilityBound = false;

  function parseTimeString(timeStr) {
    var parts = String(timeStr).split(':');
    var hours = parseInt(parts[0], 10);
    var minutes = parseInt(parts[1], 10);

    if (isNaN(hours) || isNaN(minutes)) {
      return 0;
    }

    return hours * 60 + minutes;
  }

  function minutesNow(date) {
    return date.getHours() * 60 + date.getMinutes();
  }

  function getSceneDefinition(sceneId) {
    return sceneMap[sceneId] || null;
  }

  function getSceneInstance(sceneId) {
    var definition = getSceneDefinition(sceneId);
    if (!definition || !definition.instance) {
      return null;
    }
    return definition.instance;
  }

  function clearTimer(timerRef) {
    if (timerRef !== null && timerRef !== undefined) {
      window.clearTimeout(timerRef);
    }
    return null;
  }

  function sortBySchedule(definitions) {
    return definitions.slice().sort(function (a, b) {
      var aStart = a.schedule ? parseTimeString(a.schedule.start) : 9999;
      var bStart = b.schedule ? parseTimeString(b.schedule.start) : 9999;
      return aStart - bStart;
    });
  }

  function resolveSceneIdBySchedule() {
    var scheduled = [];
    var sorted;
    var nowMinutes;
    var active = null;
    var i;

    for (i = 0; i < scenes.length; i++) {
      if (scenes[i].schedule && scenes[i].schedule.start) {
        scheduled.push(scenes[i]);
      }
    }

    if (!scheduled.length) {
      return scenes.length ? scenes[0].id : null;
    }

    sorted = sortBySchedule(scheduled);
    nowMinutes = minutesNow(new Date());
    active = sorted[sorted.length - 1];

    for (i = 0; i < sorted.length; i++) {
      if (nowMinutes >= parseTimeString(sorted[i].schedule.start)) {
        active = sorted[i];
      }
    }

    return active.id;
  }

  function getScheduledScenes() {
    var result = [];
    var i;

    for (i = 0; i < scenes.length; i++) {
      if (scenes[i].schedule && scenes[i].schedule.start) {
        result.push(scenes[i]);
      }
    }

    return result;
  }

  function msUntilNextScheduleBoundary() {
    var scheduled = sortBySchedule(getScheduledScenes());
    var now = new Date();
    var nowMinutes = minutesNow(now);
    var i;
    var nextDate;

    if (!scheduled.length) {
      return null;
    }

    for (i = 0; i < scheduled.length; i++) {
      if (parseTimeString(scheduled[i].schedule.start) > nowMinutes) {
        nextDate = new Date(now.getTime());
        nextDate.setHours(Math.floor(parseTimeString(scheduled[i].schedule.start) / 60));
        nextDate.setMinutes(parseTimeString(scheduled[i].schedule.start) % 60);
        nextDate.setSeconds(0, 0);
        return Math.max(nextDate.getTime() - now.getTime(), 1000);
      }
    }

    nextDate = new Date(now.getTime());
    nextDate.setDate(nextDate.getDate() + 1);
    nextDate.setHours(Math.floor(parseTimeString(scheduled[0].schedule.start) / 60));
    nextDate.setMinutes(parseTimeString(scheduled[0].schedule.start) % 60);
    nextDate.setSeconds(0, 0);
    return Math.max(nextDate.getTime() - now.getTime(), 1000);
  }

  function getNextSceneId(currentId) {
    var i;
    var index = -1;

    for (i = 0; i < scenes.length; i++) {
      if (scenes[i].id === currentId) {
        index = i;
        break;
      }
    }

    if (index === -1) {
      return scenes.length ? scenes[0].id : null;
    }

    return scenes[(index + 1) % scenes.length].id;
  }

  function scheduleDurationTimer(sceneDef) {
    durationTimer = clearTimer(durationTimer);

    if (!sceneDef || !sceneDef.duration) {
      return;
    }

    durationTimer = window.setTimeout(function () {
      var nextId = getNextSceneId(sceneDef.id);
      if (nextId && nextId !== sceneDef.id) {
        activateSceneById(nextId);
      }
    }, sceneDef.duration);
  }

  function scheduleNextByTime() {
    var delay;

    scheduleTimer = clearTimer(scheduleTimer);

    if (forcedSceneId) {
      return;
    }

    delay = msUntilNextScheduleBoundary();
    if (delay === null) {
      return;
    }

    scheduleTimer = window.setTimeout(function () {
      var nextId = resolveSceneIdBySchedule();
      if (nextId && nextId !== currentSceneId) {
        activateSceneById(nextId);
      }
      scheduleNextByTime();
    }, delay);
  }

  function activateSceneById(sceneId) {
    var definition;
    var previousId;
    var instance;

    if (!sceneId || !mountRoot) {
      return false;
    }

    definition = getSceneDefinition(sceneId);
    if (!definition) {
      return false;
    }

    previousId = currentSceneId;

    if (currentScene && typeof currentScene.deactivate === 'function') {
      currentScene.deactivate();
    }

    instance = definition.instance;
    if (!instance) {
      instance = AmbientDisplay.Scene.create(definition);
      definition.instance = instance;
      instance.load();
    }

    instance.activate(mountRoot);
    currentScene = instance;
    currentSceneId = sceneId;

    scheduleDurationTimer(definition);

    if (previousId !== sceneId) {
      /* Future hook: scene change events */
    }

    return true;
  }

  function handleVisibilityChange() {
    var hidden = document.hidden;

    if (hidden === undefined) {
      hidden = document.webkitHidden;
    }

    if (!hidden && !forcedSceneId) {
      activateSceneById(resolveSceneIdBySchedule());
      scheduleNextByTime();
    }
  }

  function bindVisibilityHandler() {
    if (visibilityBound || !document.addEventListener) {
      return;
    }

    document.addEventListener('visibilitychange', handleVisibilityChange, false);
    visibilityBound = true;
  }

  function setRoot(element) {
    mountRoot = element;
  }

  function start(config, options) {
    var opts = options || {};
    var definitions;
    var i;
    var targetId;

    stop();

    definitions = AmbientDisplay.sceneLoader.loadFromConfig(config);
    scenes = definitions;
    sceneMap = {};

    for (i = 0; i < scenes.length; i++) {
      scenes[i].instance = AmbientDisplay.Scene.create(scenes[i]);
      scenes[i].instance.load();
      sceneMap[scenes[i].id] = scenes[i];
    }

    if (!scenes.length) {
      return false;
    }

    forcedSceneId = opts.forceScene || null;
    targetId = forcedSceneId || resolveSceneIdBySchedule();

    activateSceneById(targetId);
    scheduleNextByTime();
    bindVisibilityHandler();

    return true;
  }

  function stop() {
    scheduleTimer = clearTimer(scheduleTimer);
    durationTimer = clearTimer(durationTimer);

    if (currentScene && typeof currentScene.destroy === 'function') {
      currentScene.destroy();
    }

    var i;
    for (i = 0; i < scenes.length; i++) {
      if (scenes[i].instance) {
        scenes[i].instance.destroy();
        scenes[i].instance = null;
      }
    }

    scenes = [];
    sceneMap = {};
    currentScene = null;
    currentSceneId = null;
    forcedSceneId = null;
  }

  function getCurrentScene() {
    return currentScene;
  }

  function getCurrentSceneId() {
    return currentSceneId;
  }

  function forceScene(sceneId) {
    forcedSceneId = sceneId || null;
    scheduleTimer = clearTimer(scheduleTimer);

    if (forcedSceneId) {
      activateSceneById(forcedSceneId);
      return true;
    }

    activateSceneById(resolveSceneIdBySchedule());
    scheduleNextByTime();
    return true;
  }

  return {
    setRoot: setRoot,
    start: start,
    stop: stop,
    getCurrentScene: getCurrentScene,
    getCurrentSceneId: getCurrentSceneId,
    forceScene: forceScene
  };
}());
