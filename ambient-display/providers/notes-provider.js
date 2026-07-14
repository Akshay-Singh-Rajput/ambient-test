/**
 * providers/notes-provider.js — Pinned notes only (ES5)
 */

/* global AmbientDisplay */
(function () {
  var u = AmbientDisplay.providerUtils;
  var REFRESH = 300000;

  function build(config, now) {
    var notes = config && config.notes ? config.notes : [];
    var pinned = [];
    var i;

    for (i = 0; i < notes.length; i++) {
      if (notes[i].pinned && notes[i].text && !notes[i].checked) {
        pinned.push(notes[i]);
      }
    }

    if (!pinned.length) {
      return u.emptyContent('notes', REFRESH);
    }

    return u.makeContent({
      id: 'notes',
      hasContent: true,
      priority: 45,
      regionPreference: 'ambient',
      canBeHero: false,
      canRotate: true,
      refreshInterval: REFRESH,
      payload: {
        text: pinned[0].text,
        count: pinned.length
      }
    });
  }

  AmbientDisplay.providerRegistry.register(
    AmbientDisplay.createProvider({ id: 'notes', refreshMs: REFRESH, build: build })
  );
}());
