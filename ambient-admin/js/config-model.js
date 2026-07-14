/**
 * config-model.js — Config state for Ambient Display Admin
 *
 * Holds the draft config.json structure and notifies listeners on change.
 */

var AmbientAdmin = AmbientAdmin || {};

AmbientAdmin.configModel = (function () {
  var SCENE_IDS = ['morning', 'day', 'evening', 'night'];
  var DEFAULT_BOUNDARIES = {
    morning: '05:00',
    day: '09:00',
    evening: '17:00',
    night: '21:00'
  };

  var listeners = [];
  var config = null;

  function defaultClockWidget(id, hourFormat, showSeconds) {
    return {
      type: 'clock',
      id: id,
      size: { width: 'auto', height: 'auto' },
      options: {
        showSeconds: showSeconds !== false,
        showDate: true,
        hourFormat: hourFormat || '12',
        timezone: 'Asia/Kolkata'
      }
    };
  }

  function defaultScene(id) {
    var themes = { morning: 'light', day: 'light', evening: 'dark', night: 'midnight' };
    var formats = { morning: '12', day: '24', evening: '12', night: '12' };
    var seconds = { morning: true, day: true, evening: true, night: false };

    return {
      id: id,
      start: DEFAULT_BOUNDARIES[id],
      theme: { name: themes[id] || 'dark' },
      layout: { type: 'center', gap: '2rem', padding: '2rem', columns: 2 },
      widgets: [defaultClockWidget(id + '-clock', formats[id], seconds[id])]
    };
  }

  function createDefaultConfig() {
    var scenes = SCENE_IDS.map(defaultScene);

    return {
      version: '1.0.0',
      scheduler: {
        enabled: true,
        scenes: scenes
      },
      theme: { name: 'dark' },
      layout: { type: 'center', gap: '2rem', padding: '2rem', columns: 2 },
      widgets: [defaultClockWidget('primary-clock', '12', true)]
    };
  }

  function notify() {
    listeners.forEach(function (fn) {
      fn(getConfig());
    });
  }

  function init(initial) {
    config = initial || createDefaultConfig();
    notify();
    return config;
  }

  function getConfig() {
    return JSON.parse(JSON.stringify(config));
  }

  function setConfig(next) {
    config = JSON.parse(JSON.stringify(next));
    AmbientAdmin.storage.saveDraft(config);
    notify();
  }

  function update(path, value) {
    var parts = path.split('.');
    var cursor = config;
    var i;

    for (i = 0; i < parts.length - 1; i++) {
      if (!cursor[parts[i]]) {
        cursor[parts[i]] = {};
      }
      cursor = cursor[parts[i]];
    }

    cursor[parts[parts.length - 1]] = value;
    AmbientAdmin.storage.saveDraft(config);
    notify();
  }

  function getScene(sceneId) {
    var scenes = config.scheduler.scenes || [];
    return scenes.find(function (s) { return s.id === sceneId; });
  }

  function updateScene(sceneId, patch) {
    var scenes = config.scheduler.scenes || [];
    var index = scenes.findIndex(function (s) { return s.id === sceneId; });

    if (index === -1) {
      return;
    }

    Object.keys(patch).forEach(function (key) {
      scenes[index][key] = patch[key];
    });

    config.scheduler.scenes = scenes;
    AmbientAdmin.storage.saveDraft(config);
    notify();
  }

  function onChange(callback) {
    listeners.push(callback);
  }

  return {
    SCENE_IDS: SCENE_IDS,
    createDefaultConfig: createDefaultConfig,
    init: init,
    getConfig: getConfig,
    setConfig: setConfig,
    update: update,
    getScene: getScene,
    updateScene: updateScene,
    onChange: onChange
  };
})();
