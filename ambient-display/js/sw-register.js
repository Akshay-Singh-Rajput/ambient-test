/**
 * sw-register.js — Service worker registration for Ambient Display
 *
 * Registers the service worker, checks cache-manifest.json for version
 * changes, and triggers an update when a new release is detected.
 */

/* global AmbientDisplay */
(function () {
  var MANIFEST_PATH = './cache-manifest.json';
  var VERSION_KEY = 'cache-version';
  var pendingReload = false;

  /**
   * Service Workers are not available on very old Safari (pre-iOS 11.3).
   * The app still runs — it just won't cache offline.
   */
  function isSupported() {
    return 'serviceWorker' in navigator;
  }

  /**
   * Compare manifest version with stored version; update SW when changed.
   */
  function checkVersion(registration) {
    fetch(MANIFEST_PATH, { cache: 'no-store' }).then(function (response) {
      return response.json();
    }).then(function (manifest) {
      var storedVersion = AmbientDisplay.storage.get(VERSION_KEY);

      if (storedVersion !== manifest.version) {
        pendingReload = true;
        registration.update();

        if (registration.waiting) {
          registration.waiting.postMessage('skipWaiting');
        }
      }

      AmbientDisplay.storage.set(VERSION_KEY, manifest.version);
    }).catch(function () {
      /* Offline — continue with cached assets */
    });
  }

  /**
   * Reload once when a new service worker takes control after a version bump.
   */
  function bindControllerChange() {
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (pendingReload) {
        pendingReload = false;
        window.location.reload();
      }
    });
  }

  /**
   * Register the service worker after the page load event.
   */
  function register() {
    navigator.serviceWorker.register('./service-worker.js').then(function (registration) {
      checkVersion(registration);

      registration.addEventListener('updatefound', function () {
        var installing = registration.installing;

        if (!installing) {
          return;
        }

        installing.addEventListener('statechange', function () {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            installing.postMessage('skipWaiting');
          }
        });
      });
    }).catch(function () {
      /* Registration failed — app continues without offline support */
    });
  }

  if (!isSupported()) {
    return;
  }

  bindControllerChange();

  if (window.addEventListener) {
    window.addEventListener('load', register, false);
  } else {
    window.onload = register;
  }
}());
