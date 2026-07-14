/**
 * app.js — Always-on ambient display entry point (ES5)
 */

/* global AmbientDisplay */
(function () {
  var ROOT_ID = 'ambient-root';
  var refreshTimer = null;
  var REFRESH_MS = 60000;

  function isPreviewMode() {
    return AmbientDisplay.previewMode && AmbientDisplay.previewMode.isAdminPreview();
  }

  function renderFrame() {
    var config = AmbientDisplay.configLoader.getConfig();
    var settings = config.settings || {};
    var screen = AmbientDisplay.presentationEngine.buildScreen(new Date());
    var refreshMs = settings.contentRefreshMs || REFRESH_MS;

    AmbientDisplay.displayRenderer.render(screen);

    if (screen.minimalRefresh) {
      refreshMs = settings.nightClockRefreshMs || 300000;
    }

    if (refreshTimer) {
      window.clearInterval(refreshTimer);
    }
    refreshTimer = window.setInterval(renderFrame, refreshMs);
  }

  function teardown() {
    if (refreshTimer) {
      window.clearInterval(refreshTimer);
      refreshTimer = null;
    }
    AmbientDisplay.themeEngine.stopAutoUpdate();
    AmbientDisplay.displayRenderer.destroy();
    AmbientDisplay.shell.destroy();
    AmbientDisplay.providerRegistry.destroyAll();
  }

  function applyDisplayProfile(config) {
    var display = config.display || {};
    var target = display.target || 'ipad-mini-a1455';
    var html = document.documentElement;
    var body = document.body;

    if (target === 'ipad-mini-a1455') {
      html.className = (html.className + ' ambient-ipad-mini').replace(/\s+/g, ' ').replace(/^\s|\s$/g, '');
      body.className = 'ambient-body ambient-ipad-mini';
    } else {
      body.className = 'ambient-body';
    }
  }

  function bootstrapWithConfig(config) {
    var root = document.getElementById(ROOT_ID);
    var settings = config.settings || {};

    if (!root) {
      return;
    }

    teardown();
    root.innerHTML = '';

    AmbientDisplay.configLoader.setConfig(config);
    applyDisplayProfile(config);

    var app = document.createElement('div');
    app.className = 'ambient-app ambient-display-standard';
    root.appendChild(app);

    AmbientDisplay.providerRegistry.initializeAll(config);
    AmbientDisplay.themeEngine.startAutoUpdate();
    AmbientDisplay.shell.mount(app, config);
    AmbientDisplay.displayRenderer.mount(app, settings);
    renderFrame();

    if (window.AmbientRefreshControl && window.AmbientRefreshControl.mount) {
      window.AmbientRefreshControl.mount();
    }
  }

  function bindPreviewChannel() {
    window.addEventListener('message', function (event) {
      var data = event.data;
      if (!data || data.type !== 'ambient:preview-config') {
        return;
      }
      bootstrapWithConfig(AmbientDisplay.configLoader.normalizeConfig(data.config));
    }, false);
  }

  function bootstrap() {
    if (isPreviewMode()) {
      bindPreviewChannel();
      return;
    }

    AmbientDisplay.configLoader.load(function (error, config) {
      if (error) {
        var root = document.getElementById(ROOT_ID);
        if (root) {
          root.innerHTML = '<div class="ambient-error">Failed to load configuration.</div>';
        }
        return;
      }
      bootstrapWithConfig(config);
    });
  }

  if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', bootstrap, false);
  } else {
    window.onload = bootstrap;
  }
}());
