/**
 * app.js — Entry point for Ambient Display
 *
 * Bootstraps the platform: loads configuration and hands control to the
 * scheduler, which applies theme, renders the active scene, and manages transitions.
 */

/* global AmbientDisplay */
(function () {
  var ROOT_ID = 'ambient-root';

  /**
   * Resolve the DOM mount node or report a fatal setup error.
   */
  function getRootElement() {
    return document.getElementById(ROOT_ID);
  }

  /**
   * Platform bootstrap sequence.
   */
  function bootstrap() {
    var rootElement = getRootElement();

    if (!rootElement) {
      return;
    }

    AmbientDisplay.renderer.init(rootElement);

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

  /* DOMContentLoaded is preferred; onload is the fallback for older browsers */
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
