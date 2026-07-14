/**
 * app.js — Entry point for Ambient Display
 *
 * Bootstraps the platform: loads configuration and hands control to the
 * scheduler. Supports admin live preview via postMessage (?preview=1).
 */

/* global AmbientDisplay */
(function () {
  var ROOT_ID = 'ambient-root';

  function isPreviewMode() {
    return window.location.search.indexOf('preview=1') !== -1;
  }

  function getRootElement() {
    return document.getElementById(ROOT_ID);
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

  function startPlatform(config, options) {
    var rootElement = getRootElement();
    var normalized = config;
    var opts = options || {};
    var sceneId = opts.forceScene || null;
    var renderConfig;

    if (!rootElement) {
      return;
    }

    if (AmbientDisplay.configLoader && AmbientDisplay.configLoader.normalizeConfig) {
      normalized = AmbientDisplay.configLoader.normalizeConfig(config);
    }

    stopScheduler();
    AmbientDisplay.renderer.init(rootElement);

    if (sceneId && normalized.scheduler && normalized.scheduler.enabled) {
      renderConfig = buildSceneRenderConfig(normalized, sceneId);
      AmbientDisplay.themeEngine.apply(renderConfig.theme);
      AmbientDisplay.render(renderConfig);
      return;
    }

    AmbientDisplay.scheduler.start(normalized);
  }

  function bootstrapFromNetwork() {
    AmbientDisplay.renderer.init(getRootElement());

    AmbientDisplay.configLoader.load(function (error, config) {
      if (error) {
        AmbientDisplay.renderer.renderError(
          'Failed to load configuration. Serve over HTTP or deploy to GitHub Pages.'
        );
        return;
      }

      AmbientDisplay.scheduler.start(config);
    });
  }

  function bindPreviewChannel() {
    window.addEventListener('message', function (event) {
      var data = event.data;

      if (!data || data.type !== 'ambient:preview-config') {
        return;
      }

      startPlatform(data.config, { forceScene: data.forceScene || null });
    });
  }

  function bootstrap() {
    if (isPreviewMode()) {
      AmbientDisplay.renderer.init(getRootElement());
      bindPreviewChannel();
      return;
    }

    bootstrapFromNetwork();
  }

  if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', bootstrap, false);
  } else if (document.attachEvent) {
    document.attachEvent('onreadystatechange', function () {
      if (document.readyState === 'complete') {
        bootstrap();
      }
    });
  } else {
    window.onload = bootstrap;
  }
}());
