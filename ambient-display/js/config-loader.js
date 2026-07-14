/**
 * config-loader.js — Configuration loader for Ambient Display
 *
 * Fetches config/config.json over HTTP and validates the platform schema.
 * Uses XMLHttpRequest for broad Safari compatibility (including older iOS).
 */

/* global AmbientDisplay */
var AmbientDisplay = AmbientDisplay || {};

AmbientDisplay.configLoader = (function () {
  var CONFIG_PATH = 'config/config.json';
  var SUPPORTED_THEMES = ['light', 'dark', 'midnight', 'minimal'];
  var SUPPORTED_LAYOUTS = ['center', 'stack', 'grid', 'fullscreen', 'top-bottom'];
  var DEFAULT_CONFIG = {
    version: '0.0.0',
    theme: { name: 'dark' },
    layout: {
      type: 'center',
      gap: '2rem',
      padding: '2rem',
      columns: 2
    },
    widgets: []
  };

  /**
   * Resolve layout type against supported values; unknown names fall back to center.
   */
  function normalizeLayoutType(name) {
    var requested = typeof name === 'string' ? name.toLowerCase() : '';
    var i;

    for (i = 0; i < SUPPORTED_LAYOUTS.length; i++) {
      if (SUPPORTED_LAYOUTS[i] === requested) {
        return requested;
      }
    }

    return DEFAULT_CONFIG.layout.type;
  }

  /**
   * Normalize layout block from config.json.
   */
  function normalizeLayout(layoutConfig) {
    var layout = layoutConfig || {};
    var columns = parseInt(layout.columns, 10);

    if (isNaN(columns) || columns < 1) {
      columns = DEFAULT_CONFIG.layout.columns;
    }

    return {
      type: normalizeLayoutType(layout.type),
      gap: typeof layout.gap === 'string' ? layout.gap : DEFAULT_CONFIG.layout.gap,
      padding: typeof layout.padding === 'string' ? layout.padding : DEFAULT_CONFIG.layout.padding,
      columns: columns
    };
  }

  /**
   * Resolve theme name against supported values; unknown names fall back to dark.
   */
  function normalizeThemeName(name) {
    var requested = typeof name === 'string' ? name.toLowerCase() : '';
    var i;

    for (i = 0; i < SUPPORTED_THEMES.length; i++) {
      if (SUPPORTED_THEMES[i] === requested) {
        return requested;
      }
    }

    return DEFAULT_CONFIG.theme.name;
  }

  /**
   * Normalize scheduler block and scene list from config.json.
   */
  function normalizeScheduler(schedulerConfig, baseConfig) {
    var scheduler = schedulerConfig || {};
    var scenes = Object.prototype.toString.call(scheduler.scenes) === '[object Array]'
      ? scheduler.scenes
      : [];

    return {
      enabled: scheduler.enabled === true,
      scenes: scenes
    };
  }

  /**
   * Ensure required top-level fields exist with safe defaults.
   */
  function normalizeConfig(rawConfig) {
    var config = rawConfig || {};
    var theme = config.theme || {};
    var normalized = {
      version: typeof config.version === 'string' ? config.version : DEFAULT_CONFIG.version,
      theme: {
        name: normalizeThemeName(theme.name)
      },
      layout: normalizeLayout(config.layout),
      widgets: Object.prototype.toString.call(config.widgets) === '[object Array]'
        ? config.widgets
        : DEFAULT_CONFIG.widgets,
      scheduler: null
    };

    normalized.scheduler = normalizeScheduler(config.scheduler, normalized);

    return normalized;
  }

  /**
   * Load configuration from disk.
   *
   * @param {Function} callback - function(error, config)
   */
  function load(callback) {
    var xhr = new XMLHttpRequest();

    xhr.open('GET', CONFIG_PATH, true);

    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) {
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          callback(null, normalizeConfig(JSON.parse(xhr.responseText)));
        } catch (parseError) {
          callback(parseError, null);
        }
        return;
      }

      callback(new Error('Unable to load config (HTTP ' + xhr.status + ')'), null);
    };

    xhr.onerror = function () {
      callback(new Error('Network error while loading config'), null);
    };

    xhr.send(null);
  }

  return {
    load: load,
    normalizeConfig: normalizeConfig
  };
}());
