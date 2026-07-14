/**
 * providers/clock-provider.js — Clock metadata (display handled by shell) (ES5)
 */

/* global AmbientDisplay */
(function () {
  var u = AmbientDisplay.providerUtils;
  var REFRESH = 1000;

  function build(config, now) {
    return u.emptyContent('clock', REFRESH);
  }

  AmbientDisplay.providerRegistry.register(
    AmbientDisplay.createProvider({ id: 'clock', refreshMs: REFRESH, build: build })
  );
}());
