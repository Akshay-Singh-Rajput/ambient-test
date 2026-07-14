/**
 * asset-manager.js — Asset manager for Ambient Display
 *
 * Handles lazy image loading, video playback, preloading, placeholders,
 * and memory cleanup. Designed for low-memory kiosk hardware and old Safari.
 * Widgets consume this module — it has no widget-specific logic.
 */

/* global AmbientDisplay */
var AmbientDisplay = AmbientDisplay || {};

AmbientDisplay.assetManager = (function () {
  var MAX_CACHE_ENTRIES = 8;
  var VIEWPORT_MARGIN = 50;
  var SCROLL_THROTTLE_MS = 250;

  /* Inline SVG placeholder — no network request, works offline */
  var DEFAULT_PLACEHOLDER =
    'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">' +
      '<rect fill="#1e293b" width="400" height="300"/>' +
      '<text x="200" y="155" fill="#64748b" font-family="sans-serif" font-size="16" text-anchor="middle">Loading</text>' +
      '</svg>'
    );

  var cache = {};
  var lazyElements = [];
  var lazyLoader = null;
  var scrollTimer = null;
  var scrollBound = false;

  /**
   * Track a loaded asset for later cleanup and LRU eviction.
   */
  function trackAsset(url, type, element) {
    cache[url] = {
      type: type,
      element: element,
      lastUsed: Date.now()
    };

    enforceCacheLimit();
  }

  /**
   * Evict oldest cached assets when over the memory budget.
   */
  function enforceCacheLimit() {
    var keys = [];
    var i;
    var sorted;
    var evictCount;

    for (var key in cache) {
      if (cache.hasOwnProperty(key)) {
        keys.push(key);
      }
    }

    if (keys.length <= MAX_CACHE_ENTRIES) {
      return;
    }

    sorted = keys.sort(function (a, b) {
      return cache[a].lastUsed - cache[b].lastUsed;
    });

    evictCount = keys.length - MAX_CACHE_ENTRIES;

    for (i = 0; i < evictCount; i++) {
      release(sorted[i]);
    }
  }

  /**
   * Touch an asset so LRU eviction keeps recently used items.
   */
  function touchAsset(url) {
    if (cache.hasOwnProperty(url)) {
      cache[url].lastUsed = Date.now();
    }
  }

  /**
   * Throttle helper for scroll/resize fallback on old Safari.
   */
  function throttle(fn, wait) {
    var lastRun = 0;

    return function () {
      var now = Date.now();

      if (now - lastRun >= wait) {
        lastRun = now;
        fn();
      }
    };
  }

  /**
   * Viewport check used when IntersectionObserver is unavailable.
   */
  function isInViewport(element) {
    var rect = element.getBoundingClientRect();
    var windowHeight = window.innerHeight || document.documentElement.clientHeight;
    var windowWidth = window.innerWidth || document.documentElement.clientWidth;

    return (
      rect.bottom >= -VIEWPORT_MARGIN &&
      rect.top <= windowHeight + VIEWPORT_MARGIN &&
      rect.right >= -VIEWPORT_MARGIN &&
      rect.left <= windowWidth + VIEWPORT_MARGIN
    );
  }

  /**
   * Load a lazy element once it enters the viewport.
   */
  function triggerLazyLoad(element) {
    if (element.getAttribute('data-asset-loaded') === 'true') {
      return;
    }

    element.setAttribute('data-asset-loaded', 'true');

    if (typeof element._assetLoadCallback === 'function') {
      element._assetLoadCallback();
    }
  }

  /**
   * Scan lazy elements for visibility (IntersectionObserver fallback).
   */
  function scanLazyElements() {
    var remaining = [];
    var i;

    for (i = 0; i < lazyElements.length; i++) {
      if (isInViewport(lazyElements[i])) {
        triggerLazyLoad(lazyElements[i]);
      } else {
        remaining.push(lazyElements[i]);
      }
    }

    lazyElements = remaining;
  }

  /**
   * Bind throttled scroll/resize listeners once for lazy-load fallback.
   */
  function bindScrollFallback() {
    var handler;

    if (scrollBound) {
      return;
    }

    handler = throttle(scanLazyElements, SCROLL_THROTTLE_MS);

    if (window.addEventListener) {
      window.addEventListener('scroll', handler, false);
      window.addEventListener('resize', handler, false);
    } else if (window.attachEvent) {
      window.attachEvent('onscroll', handler);
      window.attachEvent('onresize', handler);
    }

    scrollBound = true;
  }

  /**
   * Register an element for lazy loading when it enters the viewport.
   */
  function observeLazy(element, loadCallback) {
    element._assetLoadCallback = loadCallback;

    if (typeof IntersectionObserver !== 'undefined') {
      if (!lazyLoader) {
        lazyLoader = new IntersectionObserver(function (entries) {
          var i;

          for (i = 0; i < entries.length; i++) {
            if (entries[i].isIntersecting || entries[i].intersectionRatio > 0) {
              triggerLazyLoad(entries[i].target);
              lazyLoader.unobserve(entries[i].target);
            }
          }
        }, { rootMargin: String(VIEWPORT_MARGIN) + 'px' });
      }

      lazyLoader.observe(element);
      return;
    }

    /* Fallback for old Safari without IntersectionObserver */
    lazyElements.push(element);
    bindScrollFallback();
    scanLazyElements();
  }

  /**
   * Apply a fallback placeholder when an asset fails to load.
   */
  function applyErrorPlaceholder(element, placeholderSrc) {
    element.className += ' ambient-asset--error';

    if (element.tagName === 'IMG') {
      element.src = placeholderSrc || DEFAULT_PLACEHOLDER;
      element.alt = element.alt || 'Asset unavailable';
    }

    if (element.tagName === 'VIDEO') {
      element.removeAttribute('src');
      element.className += ' ambient-asset--video-error';
    }
  }

  /**
   * Preload a single image into memory.
   */
  function preloadImage(url, callback) {
    var img = new Image();

    img.onload = function () {
      trackAsset(url, 'image', img);
      touchAsset(url);

      if (typeof callback === 'function') {
        callback(null, img);
      }
    };

    img.onerror = function () {
      if (typeof callback === 'function') {
        callback(new Error('Failed to preload image: ' + url), null);
      }
    };

    img.src = url;
  }

  /**
   * Preload video metadata without attaching to the DOM.
   */
  function preloadVideo(url, callback) {
    var video = document.createElement('video');
    var cleaned = false;

    function done(error) {
      if (cleaned) {
        return;
      }

      cleaned = true;

      if (error) {
        video.removeAttribute('src');

        if (video.load) {
          video.load();
        }

        if (typeof callback === 'function') {
          callback(error, null);
        }

        return;
      }

      trackAsset(url, 'video', video);
      touchAsset(url);

      if (typeof callback === 'function') {
        callback(null, video);
      }
    }

    video.preload = 'metadata';
    video.muted = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');

    video.onloadedmetadata = function () {
      done(null);
    };

    video.onerror = function () {
      done(new Error('Failed to preload video: ' + url));
    };

    video.src = url;
  }

  /**
   * Begin loading an image into a container element.
   */
  function loadImage(container, options, callback) {
    var opts = options || {};
    var src = opts.src;
    var img = document.createElement('img');
    var placeholder = opts.placeholder || DEFAULT_PLACEHOLDER;
    var lazy = opts.lazy !== false;

    if (!src) {
      if (typeof callback === 'function') {
        callback(new Error('Image src is required'), null);
      }

      return null;
    }

    img.className = opts.className || 'ambient-asset ambient-asset--image';
    img.alt = opts.alt || '';

    if (opts.width) {
      img.width = opts.width;
    }

    if (opts.height) {
      img.height = opts.height;
    }

    img.src = placeholder;
    container.appendChild(img);

    function startLoad() {
      img.setAttribute('data-asset-src', src);

      img.onload = function () {
        trackAsset(src, 'image', img);
        touchAsset(src);

        if (typeof callback === 'function') {
          callback(null, img);
        }
      };

      img.onerror = function () {
        applyErrorPlaceholder(img, placeholder);

        if (typeof callback === 'function') {
          callback(new Error('Failed to load image: ' + src), img);
        }
      };

      img.src = src;
    }

    if (lazy) {
      observeLazy(container, startLoad);
    } else {
      startLoad();
    }

    return img;
  }

  /**
   * Begin loading a video into a container element.
   */
  function loadVideo(container, options, callback) {
    var opts = options || {};
    var src = opts.src;
    var video = document.createElement('video');
    var placeholder = opts.placeholder || DEFAULT_PLACEHOLDER;
    var lazy = opts.lazy !== false;
    var poster = document.createElement('img');

    if (!src) {
      if (typeof callback === 'function') {
        callback(new Error('Video src is required'), null);
      }

      return null;
    }

    video.className = opts.className || 'ambient-asset ambient-asset--video';
    video.muted = opts.muted !== false;
    video.loop = opts.loop !== false;
    video.autoplay = opts.autoplay !== false;
    video.controls = opts.controls === true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');

    if (opts.poster) {
      video.poster = opts.poster;
    } else {
      poster.className = 'ambient-asset__poster';
      poster.src = placeholder;
      poster.alt = '';
      container.appendChild(poster);
    }

    container.appendChild(video);

    function startLoad() {
      if (poster.parentNode) {
        poster.parentNode.removeChild(poster);
      }

      video.setAttribute('data-asset-src', src);

      video.onloadeddata = function () {
        trackAsset(src, 'video', video);
        touchAsset(src);

        if (video.autoplay) {
          video.play();
        }

        if (typeof callback === 'function') {
          callback(null, video);
        }
      };

      video.onerror = function () {
        applyErrorPlaceholder(video, placeholder);

        if (typeof callback === 'function') {
          callback(new Error('Failed to load video: ' + src), video);
        }
      };

      video.src = src;

      if (video.load) {
        video.load();
      }
    }

    if (lazy) {
      observeLazy(container, startLoad);
    } else {
      startLoad();
    }

    return video;
  }

  /**
   * Preload one or more assets without rendering them.
   */
  function preload(urls, options, callback) {
    var list = Object.prototype.toString.call(urls) === '[object Array]' ? urls : [urls];
    var opts = options || {};
    var type = opts.type || 'image';
    var completed = 0;
    var errors = [];
    var i;

    if (!list.length) {
      if (typeof callback === 'function') {
        callback(null, []);
      }

      return;
    }

    if (typeof options === 'function') {
      callback = options;
      opts = {};
      type = 'image';
    }

    function checkDone() {
      completed++;

      if (completed >= list.length && typeof callback === 'function') {
        callback(errors.length ? errors : null);
      }
    }

    for (i = 0; i < list.length; i++) {
      if (type === 'video') {
        preloadVideo(list[i], function (error) {
          if (error) {
            errors.push(error);
          }

          checkDone();
        });
      } else {
        preloadImage(list[i], function (error) {
          if (error) {
            errors.push(error);
          }

          checkDone();
        });
      }
    }
  }

  /**
   * Release a single cached asset and free its memory.
   */
  function release(url) {
    var entry = cache[url];

    if (!entry) {
      return;
    }

    if (entry.type === 'video' && entry.element) {
      entry.element.pause();
      entry.element.removeAttribute('src');

      if (entry.element.load) {
        entry.element.load();
      }
    }

    if (entry.type === 'image' && entry.element) {
      entry.element.onload = null;
      entry.element.onerror = null;
      entry.element.src = '';
    }

    delete cache[url];
  }

  /**
   * Release every tracked asset — called on scene transitions.
   */
  function releaseAll() {
    var key;

    for (key in cache) {
      if (cache.hasOwnProperty(key)) {
        release(key);
      }
    }

    lazyElements = [];

    if (lazyLoader && lazyLoader.disconnect) {
      lazyLoader.disconnect();
      lazyLoader = null;
    }
  }

  /**
   * Remove asset DOM nodes from a container and release their URLs.
   */
  function destroyContainer(container) {
    var nodes;
    var i;
    var src;

    if (!container) {
      return;
    }

    nodes = container.querySelectorAll('.ambient-asset');

    for (i = 0; i < nodes.length; i++) {
      src = nodes[i].getAttribute('data-asset-src');

      if (src) {
        release(src);
      }
    }

    container.innerHTML = '';
  }

  return {
    loadImage: loadImage,
    loadVideo: loadVideo,
    preload: preload,
    release: release,
    releaseAll: releaseAll,
    destroyContainer: destroyContainer,
    getDefaultPlaceholder: function () {
      return DEFAULT_PLACEHOLDER;
    }
  };
}());
