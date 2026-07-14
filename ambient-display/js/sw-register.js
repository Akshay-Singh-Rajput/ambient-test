/**
 * sw-register.js — Service worker disabled (temporary)
 *
 * Unregisters any existing workers and clears versioned caches so the display
 * always loads fresh assets from the network during development.
 */

(function () {
  var CACHE_PREFIX = 'ambient-display-v';

  function clearAmbientCaches() {
    if (!('caches' in window)) {
      return;
    }

    caches.keys().then(function (keys) {
      var i;
      var tasks = [];

      for (i = 0; i < keys.length; i++) {
        if (keys[i].indexOf(CACHE_PREFIX) === 0) {
          tasks.push(caches.delete(keys[i]));
        }
      }

      return Promise.all(tasks);
    }).catch(function () {
      /* Cache API unavailable or blocked */
    });
  }

  function unregisterWorkers() {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    if (navigator.serviceWorker.getRegistrations) {
      navigator.serviceWorker.getRegistrations().then(function (registrations) {
        var i;

        for (i = 0; i < registrations.length; i++) {
          registrations[i].unregister();
        }
      }).catch(function () {
        /* Ignore unregister failures */
      });
      return;
    }

    if (navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then(function (registration) {
        registration.unregister();
      }).catch(function () {
        /* Ignore unregister failures */
      });
    }
  }

  function disable() {
    unregisterWorkers();
    clearAmbientCaches();
  }

  if (window.addEventListener) {
    window.addEventListener('load', disable, false);
  } else {
    window.onload = disable;
  }
}());
