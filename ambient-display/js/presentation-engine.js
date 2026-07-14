/**
 * presentation-engine.js — Collect content, select mode, build screen (ES5)
 */

/* global AmbientDisplay */
var AmbientDisplay = AmbientDisplay || {};

AmbientDisplay.presentationEngine = (function () {
  var CRITICAL_IDS = ['agenda', 'calendar', 'personalMessage'];

  function collectContent(now, minimalOnly) {
    var providers = AmbientDisplay.providerRegistry.getAll();
    var items = [];
    var i;
    var content;

    for (i = 0; i < providers.length; i++) {
      if (minimalOnly && CRITICAL_IDS.indexOf(providers[i].id) === -1) {
        continue;
      }
      content = providers[i].getContent(now);
      if (content && content.hasContent) {
        items.push(content);
      }
    }

    items.sort(function (a, b) {
      return b.priority - a.priority;
    });

    return items;
  }

  function buildScreen(now) {
    var config = AmbientDisplay.configLoader.getConfig();
    var items = collectContent(now, false);
    var displayMode = AmbientDisplay.displayModes.select(items, now, config);
    var screen;

    if (displayMode.id === 'prepare' || displayMode.id === 'bedside') {
      items = collectContent(now, true);
      displayMode = AmbientDisplay.displayModes.select(items, now, config);
    }

    screen = AmbientDisplay.presentationRules.apply(items, displayMode, config, now);
    screen.minimalRefresh = displayMode.flags && displayMode.flags.minimalRefresh;
    return screen;
  }

  return {
    buildScreen: buildScreen
  };
})();
