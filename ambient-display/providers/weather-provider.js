/**
 * providers/weather-provider.js — Static weather from config (ES5)
 */

/* global AmbientDisplay */
(function () {
  var u = AmbientDisplay.providerUtils;
  var REFRESH = 10800000;

  function build(config, now) {
    var weather = config && config.weather ? config.weather : null;
    var rainAlert = false;

    if (!weather || weather.temperature === undefined) {
      return u.emptyContent('weather', REFRESH);
    }

    if (weather.condition && String(weather.condition).toLowerCase().indexOf('rain') !== -1) {
      rainAlert = true;
    }

    return u.makeContent({
      id: 'weather',
      hasContent: true,
      priority: rainAlert ? 55 : 50,
      regionPreference: 'context',
      canBeHero: false,
      canRotate: false,
      refreshInterval: REFRESH,
      payload: {
        location: weather.location || '',
        temperature: weather.temperature,
        unit: weather.unit || 'C',
        condition: weather.condition || '',
        rainAlert: rainAlert
      }
    });
  }

  AmbientDisplay.providerRegistry.register(
    AmbientDisplay.createProvider({ id: 'weather', refreshMs: REFRESH, build: build })
  );
}());
