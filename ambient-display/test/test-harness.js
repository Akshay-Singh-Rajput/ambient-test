/**
 * test-harness.js — Test runner for Ambient Display
 *
 * Loads fixture configs, accepts live config from admin via postMessage,
 * and supports forcing scenes without waiting for local time.
 */

/* global AmbientDisplay */
(function () {
  var ROOT_ID = 'ambient-root';
  var FIXTURE_BASE = '/test/configs/';
  var SCENE_FIXTURE_PREFIX = 'scene-';
  var currentConfig = null;
  var forcedScene = null;

  function getParams() {
    var params = {};
    var search = window.location.search.replace(/^\?/, '');

    if (!search) {
      return params;
    }

    search.split('&').forEach(function (pair) {
      var parts = pair.split('=');
      params[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1] || '');
    });

    return params;
  }

  function updateToolbar(text) {
    document.getElementById('test-info').textContent = text;
  }

  function findScene(config, sceneId) {
    var scenes = config.scheduler && config.scheduler.scenes ? config.scheduler.scenes : [];
    var i;

    for (i = 0; i < scenes.length; i++) {
      if (scenes[i].id === sceneId) {
        return scenes[i];
      }
    }

    return null;
  }

  function buildSceneRenderConfig(config, sceneId) {
    var scene = findScene(config, sceneId);

    if (!scene) {
      return config;
    }

    return {
      version: config.version,
      theme: scene.theme || config.theme,
      layout: scene.layout || config.layout,
      widgets: scene.widgets || config.widgets
    };
  }

  function stopScheduler() {
    if (AmbientDisplay.scheduler && typeof AmbientDisplay.scheduler.stop === 'function') {
      AmbientDisplay.scheduler.stop();
    }
  }

  function renderConfig(config, options) {
    var opts = options || {};
    var renderConfigObj = config;
    var sceneId = opts.forceScene || forcedScene;

    stopScheduler();
    AmbientDisplay.renderer.init(document.getElementById(ROOT_ID));

    if (sceneId && config.scheduler && config.scheduler.enabled) {
      renderConfigObj = buildSceneRenderConfig(config, sceneId);
      AmbientDisplay.themeEngine.apply(renderConfigObj.theme);
      AmbientDisplay.render(renderConfigObj);
      updateToolbar('Forced scene: ' + sceneId + ' | theme: ' + renderConfigObj.theme.name);
      showSceneSelect(true);
      return;
    }

    if (config.scheduler && config.scheduler.enabled) {
      AmbientDisplay.scheduler.start(config);
      updateToolbar('Scheduler live | active: ' + AmbientDisplay.scheduler.getActiveScene());
      showSceneSelect(true);
      return;
    }

    AmbientDisplay.themeEngine.apply(renderConfigObj.theme);
    AmbientDisplay.render(renderConfigObj);
    updateToolbar('Static | theme: ' + renderConfigObj.theme.name + ' | layout: ' + renderConfigObj.layout.type);
  }

  function showSceneSelect(show) {
    document.getElementById('test-scene-select').hidden = !show;
  }

  function loadFixture(fixtureId) {
    var configFile = fixtureId;

    if (fixtureId.indexOf(SCENE_FIXTURE_PREFIX) === 0) {
      forcedScene = fixtureId.replace(SCENE_FIXTURE_PREFIX, '');
      configFile = 'scheduler-live';
    }

    if (fixtureId === 'production') {
      return fetch('../config/config.json').then(function (response) {
        return response.json();
      });
    }

    return fetch(FIXTURE_BASE + configFile + '.json').then(function (response) {
      if (!response.ok) {
        throw new Error('Fixture not found: ' + fixtureId);
      }
      return response.json();
    });
  }

  function bootstrapFromConfig(config, options) {
    currentConfig = config;

    if (AmbientDisplay.configLoader && AmbientDisplay.configLoader.normalizeConfig) {
      currentConfig = AmbientDisplay.configLoader.normalizeConfig(config);
    }

    renderConfig(currentConfig, options || {});
  }

  function bootstrap() {
    var params = getParams();

    if (params.preview === '1') {
      updateToolbar('Preview mode — waiting for admin config…');
      return;
    }

    if (params.fixture) {
      loadFixture(params.fixture).then(function (config) {
        if (params.scene) {
          forcedScene = params.scene;
        }
        bootstrapFromConfig(config, { forceScene: forcedScene });
      }).catch(function (error) {
        updateToolbar('Error: ' + error.message);
        AmbientDisplay.renderer.init(document.getElementById(ROOT_ID));
        AmbientDisplay.renderer.renderError(error.message);
      });
      return;
    }

    fetch('../config/config.json').then(function (response) {
      return response.json();
    }).then(function (config) {
      bootstrapFromConfig(config);
    }).catch(function () {
      updateToolbar('Failed to load config');
    });
  }

  function bindSceneSelect() {
    document.getElementById('test-scene-select').addEventListener('change', function (event) {
      forcedScene = event.target.value || null;

      if (currentConfig) {
        renderConfig(currentConfig, { forceScene: forcedScene });
      }
    });
  }

  function bindPreviewChannel() {
    window.addEventListener('message', function (event) {
      var data = event.data;

      if (!data || data.type !== 'ambient:preview-config') {
        return;
      }

      forcedScene = data.forceScene || null;
      bootstrapFromConfig(data.config, { preview: true, forceScene: forcedScene });
    });
  }

  if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', function () {
      bindSceneSelect();
      bindPreviewChannel();
      bootstrap();
    }, false);
  } else {
    window.onload = function () {
      bindSceneSelect();
      bindPreviewChannel();
      bootstrap();
    };
  }
}());
