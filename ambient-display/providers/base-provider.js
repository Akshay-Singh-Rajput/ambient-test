/**
 * providers/base-provider.js — Cached content provider factory (ES5)
 */

/* global AmbientDisplay */
var AmbientDisplay = AmbientDisplay || {};

AmbientDisplay.createProvider = function (spec) {
  var config = null;
  var cache = null;
  var lastBuilt = 0;
  var provider = null;

  provider = {
    id: spec.id,

    initialize: function (fullConfig) {
      config = fullConfig;
      cache = null;
      lastBuilt = 0;
    },

    getContent: function (now) {
      var interval = spec.refreshMs || 300000;
      var ts = now.getTime();

      if (!cache || ts - lastBuilt >= interval) {
        cache = spec.build(config, now);
        lastBuilt = ts;
        if (cache && cache.refreshInterval) {
          spec.refreshMs = cache.refreshInterval;
        }
      }

      return cache;
    },

    refresh: function () {
      cache = null;
      lastBuilt = 0;
    },

    destroy: function () {
      config = null;
      cache = null;
      lastBuilt = 0;
    }
  };

  return provider;
};
