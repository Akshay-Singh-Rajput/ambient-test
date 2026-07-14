/**
 * providers/quote-provider.js — Daily quote from config (ES5)
 */

/* global AmbientDisplay */
(function () {
  var u = AmbientDisplay.providerUtils;
  var REFRESH = 86400000;

  function build(config, now) {
    var quotes = config && config.quotes ? config.quotes : [];
    var quote;

    if (!quotes.length) {
      return u.emptyContent('quote', REFRESH);
    }

    quote = quotes[u.dayIndex(now) % quotes.length];

    return u.makeContent({
      id: 'quote',
      hasContent: true,
      priority: 30,
      regionPreference: 'ambient',
      canBeHero: false,
      canRotate: true,
      refreshInterval: REFRESH,
      payload: {
        text: quote.text || '',
        author: quote.author || ''
      }
    });
  }

  AmbientDisplay.providerRegistry.register(
    AmbientDisplay.createProvider({ id: 'quote', refreshMs: REFRESH, build: build })
  );
}());
