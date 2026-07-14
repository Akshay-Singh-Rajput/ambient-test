/**
 * scene-loader.js — Parse and normalize scene definitions from config.json (ES5)
 *
 * Supports the new top-level "scenes" array and migrates legacy scheduler config.
 */

/* global AmbientDisplay */
var AmbientDisplay = AmbientDisplay || {};

AmbientDisplay.sceneLoader = (function () {
  var SUPPORTED_THEMES = ['light', 'dark', 'midnight', 'minimal'];
  var SUPPORTED_LAYOUTS = ['center', 'stack', 'grid', 'fullscreen', 'top-bottom', 'dashboard', 'minimal'];
  var SUPPORTED_TRANSITIONS = ['none', 'fade', 'slide'];
  var DEFAULT_LAYOUT = { type: 'dashboard', gap: '1rem', padding: '1.25rem', columns: 3 };
  var DEFAULT_THEME = 'dark';

  function isArray(value) {
    return Object.prototype.toString.call(value) === '[object Array]';
  }

  function normalizeTheme(themeValue) {
    var name = DEFAULT_THEME;

    if (typeof themeValue === 'string') {
      name = themeValue.toLowerCase();
    } else if (themeValue && themeValue.name) {
      name = String(themeValue.name).toLowerCase();
    }

    if (SUPPORTED_THEMES.indexOf(name) === -1) {
      name = DEFAULT_THEME;
    }

    return { name: name };
  }

  function normalizeLayout(layoutValue) {
    var layout = layoutValue || {};
    var type = DEFAULT_LAYOUT.type;
    var columns;

    if (typeof layoutValue === 'string') {
      type = layoutValue.toLowerCase();
      layout = {};
    } else if (layout.type) {
      type = String(layout.type).toLowerCase();
    }

    if (SUPPORTED_LAYOUTS.indexOf(type) === -1) {
      type = DEFAULT_LAYOUT.type;
    }

    columns = parseInt(layout.columns, 10);
    if (isNaN(columns) || columns < 1) {
      columns = DEFAULT_LAYOUT.columns;
    }

    return {
      type: type,
      gap: typeof layout.gap === 'string' ? layout.gap : DEFAULT_LAYOUT.gap,
      padding: typeof layout.padding === 'string' ? layout.padding : DEFAULT_LAYOUT.padding,
      columns: columns
    };
  }

  function normalizeBackground(backgroundValue) {
    if (!backgroundValue) {
      return null;
    }

    if (typeof backgroundValue === 'string') {
      return { type: 'color', value: backgroundValue };
    }

    if (backgroundValue.type && backgroundValue.value) {
      return {
        type: String(backgroundValue.type),
        value: String(backgroundValue.value)
      };
    }

    return null;
  }

  function normalizeTransition(value) {
    var transition = typeof value === 'string' ? value.toLowerCase() : 'fade';
    if (SUPPORTED_TRANSITIONS.indexOf(transition) === -1) {
      transition = 'fade';
    }
    return transition;
  }

  function normalizeSchedule(scheduleValue, sceneId) {
    var schedule = scheduleValue || null;
    var defaults = {
      morning: '05:00',
      day: '09:00',
      evening: '17:00',
      night: '21:00'
    };

    if (!schedule && defaults[sceneId]) {
      return { start: defaults[sceneId] };
    }

    if (typeof schedule === 'string') {
      return { start: schedule };
    }

    if (schedule && schedule.start) {
      return { start: String(schedule.start) };
    }

    return null;
  }

  function normalizeDuration(value) {
    var duration = parseInt(value, 10);
    if (isNaN(duration) || duration < 1000) {
      return null;
    }
    return duration;
  }

  function normalizeCards(raw) {
    if (isArray(raw.cards)) {
      return raw.cards;
    }
    if (isArray(raw.widgets)) {
      return raw.widgets;
    }
    return [];
  }

  function normalizeScene(raw, index) {
    if (!raw || !raw.id) {
      return null;
    }

    return {
      id: String(raw.id).toLowerCase(),
      name: raw.name ? String(raw.name) : String(raw.id),
      theme: normalizeTheme(raw.theme),
      layout: normalizeLayout(raw.layout),
      background: normalizeBackground(raw.background),
      transition: normalizeTransition(raw.transition),
      cards: normalizeCards(raw),
      schedule: normalizeSchedule(raw.schedule, String(raw.id).toLowerCase()),
      duration: normalizeDuration(raw.duration),
      order: index
    };
  }

  function migrateLegacyScene(raw, index, fallback) {
    var scene = normalizeScene({
      id: raw.id,
      name: raw.name || raw.id,
      theme: raw.theme || fallback.theme,
      layout: raw.layout || fallback.layout,
      background: raw.background || null,
      transition: raw.transition || 'fade',
      cards: raw.cards || raw.widgets || fallback.cards,
      schedule: raw.start ? { start: raw.start } : raw.schedule,
      duration: raw.duration
    }, index);

    if (scene && raw.start && !scene.schedule) {
      scene.schedule = { start: raw.start };
    }

    return scene;
  }

  function loadFromConfig(config) {
    var scenes = [];
    var fallback;
    var i;
    var raw;
    var scene;

    if (!config) {
      return scenes;
    }

    fallback = {
      theme: normalizeTheme(config.theme),
      layout: normalizeLayout(config.layout),
      cards: isArray(config.cards) ? config.cards : (isArray(config.widgets) ? config.widgets : [])
    };

    if (isArray(config.scenes) && config.scenes.length) {
      for (i = 0; i < config.scenes.length; i++) {
        scene = normalizeScene(config.scenes[i], i);
        if (scene) {
          scenes.push(scene);
        }
      }
      return scenes;
    }

    if (config.scheduler && isArray(config.scheduler.scenes) && config.scheduler.scenes.length) {
      for (i = 0; i < config.scheduler.scenes.length; i++) {
        scene = migrateLegacyScene(config.scheduler.scenes[i], i, fallback);
        if (scene) {
          if (!scene.cards.length && fallback.cards.length) {
            scene.cards = fallback.cards;
          }
          scenes.push(scene);
        }
      }
      return scenes;
    }

    if (fallback.cards.length || config.theme || config.layout) {
      scenes.push(normalizeScene({
        id: 'default',
        name: 'Default',
        theme: fallback.theme,
        layout: fallback.layout,
        cards: fallback.cards,
        transition: 'fade'
      }, 0));
    }

    return scenes;
  }

  return {
    loadFromConfig: loadFromConfig,
    normalizeScene: normalizeScene
  };
}());
