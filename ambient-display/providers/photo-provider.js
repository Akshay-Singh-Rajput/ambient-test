/**
 * providers/photo-provider.js — Rotating photos from config (ES5)
 */

/* global AmbientDisplay */
(function () {
  var u = AmbientDisplay.providerUtils;
  var DEFAULT_ROTATE_MIN = 30;

  function getRotationMs(config) {
    var minutes = DEFAULT_ROTATE_MIN;
    if (config && config.settings && config.settings.photoRotationMinutes) {
      minutes = config.settings.photoRotationMinutes;
    }
    if (config && config.photos && config.photos.rotationMinutes) {
      minutes = config.photos.rotationMinutes;
    }
    return minutes * 60000;
  }

  function build(config, now) {
    var photos = config && config.photos && config.photos.items ? config.photos.items : [];
    var album = config && config.photos && config.photos.album ? config.photos.album : 'Memories';
    var refreshMs = getRotationMs(config);
    var slot = Math.floor(now.getTime() / refreshMs);
    var photo;

    if (!photos.length) {
      return u.emptyContent('photo', refreshMs);
    }

    photo = photos[slot % photos.length];

    return u.makeContent({
      id: 'photo',
      hasContent: true,
      priority: 20,
      regionPreference: 'ambient',
      canBeHero: true,
      canRotate: true,
      refreshInterval: refreshMs,
      payload: {
        src: photo.src,
        caption: photo.caption || '',
        album: album
      }
    });
  }

  AmbientDisplay.providerRegistry.register(
    AmbientDisplay.createProvider({ id: 'photo', refreshMs: DEFAULT_ROTATE_MIN * 60000, build: build })
  );
}());
