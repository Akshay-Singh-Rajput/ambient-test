/**
 * presentation-engine.js — Collect provider content and delegate to rules (ES5)
 */

/* global AmbientDisplay */
var AmbientDisplay = AmbientDisplay || {};

AmbientDisplay.presentationEngine = (function () {
  function collectContent(now) {
    var providers = AmbientDisplay.providerRegistry.getAll();
    var items = [];
    var i;
    var content;

    for (i = 0; i < providers.length; i++) {
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
    var items = collectContent(now);
    return AmbientDisplay.presentationRules.apply(items);
  }

  return {
    buildScreen: buildScreen
  };
})();
