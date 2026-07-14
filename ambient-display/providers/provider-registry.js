/**
 * providers/provider-registry.js — Content provider registry (ES5)
 */

/* global AmbientDisplay */
var AmbientDisplay = AmbientDisplay || {};

AmbientDisplay.providerRegistry = (function () {
  var providers = [];

  function register(provider) {
    if (!provider || !provider.id) {
      return false;
    }
    providers.push(provider);
    return true;
  }

  function getAll() {
    return providers.slice();
  }

  function initializeAll(config) {
    var i;
    for (i = 0; i < providers.length; i++) {
      if (typeof providers[i].initialize === 'function') {
        providers[i].initialize(config);
      }
    }
  }

  function destroyAll() {
    var i;
    for (i = 0; i < providers.length; i++) {
      if (typeof providers[i].destroy === 'function') {
        providers[i].destroy();
      }
    }
  }

  return {
    register: register,
    getAll: getAll,
    initializeAll: initializeAll,
    destroyAll: destroyAll
  };
})();
