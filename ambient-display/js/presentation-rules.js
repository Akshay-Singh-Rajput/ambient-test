/**
 * presentation-rules.js — Curate provider content into display regions (ES5)
 */

/* global AmbientDisplay */
var AmbientDisplay = AmbientDisplay || {};

AmbientDisplay.presentationRules = (function () {
  var CONTEXT_LIMIT = 3;

  function findById(items, id) {
    var i;
    for (i = 0; i < items.length; i++) {
      if (items[i].id === id) {
        return items[i];
      }
    }
    return null;
  }

  function isUsed(item, hero, context) {
    var i;

    if (hero && hero.id === item.id) {
      return true;
    }

    for (i = 0; i < context.length; i++) {
      if (context[i].id === item.id) {
        return true;
      }
    }

    return false;
  }

  function cloneAsHero(item) {
    return {
      id: item.id,
      hasContent: true,
      priority: item.priority,
      regionPreference: 'hero',
      canBeHero: true,
      canRotate: false,
      refreshInterval: item.refreshInterval,
      payload: item.payload,
      fallback: true
    };
  }

  function pickHero(items) {
    var i;
    var item;
    var photo = findById(items, 'photo');
    var message = findById(items, 'personalMessage');

    for (i = 0; i < items.length; i++) {
      item = items[i];
      if (item.canBeHero && item.priority >= 80) {
        return item;
      }
    }

    if (message && message.canBeHero) {
      return message;
    }

    if (photo) {
      return cloneAsHero(photo);
    }

    if (message && message.hasContent) {
      return cloneAsHero(message);
    }

    return null;
  }

  function pickContext(items, hero) {
    var context = [];
    var i;
    var item;

    for (i = 0; i < items.length && context.length < CONTEXT_LIMIT; i++) {
      item = items[i];
      if (isUsed(item, hero, context)) {
        continue;
      }
      if (item.regionPreference === 'context') {
        context.push(item);
      }
    }

    return context;
  }

  function pickAmbient(items, hero, context) {
    var ambient = [];
    var i;
    var item;

    for (i = 0; i < items.length; i++) {
      item = items[i];
      if (isUsed(item, hero, context)) {
        continue;
      }
      if (item.canRotate || item.regionPreference === 'ambient') {
        ambient.push(item);
      }
    }

    return ambient;
  }

  function resolveMode(hero) {
    if (!hero || !hero.payload) {
      return 'normal';
    }
    if (hero.payload.emphasis === 'celebratory') {
      return 'celebratory';
    }
    if (hero.payload.emphasis === 'warning') {
      return 'warning';
    }
    return 'normal';
  }

  function apply(items) {
    var hero = pickHero(items);
    var context = pickContext(items, hero);
    var ambient = pickAmbient(items, hero, context);

    return {
      hero: hero,
      context: context,
      ambient: ambient,
      mode: resolveMode(hero)
    };
  }

  return {
    apply: apply
  };
})();
