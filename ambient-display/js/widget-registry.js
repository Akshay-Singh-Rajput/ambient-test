/**
 * widget-registry.js — Widget type registry for Ambient Display
 *
 * Central lookup table mapping config "type" strings to widget factories.
 * New widgets self-register here; the renderer never imports widget code directly.
 *
 * Factory contract:
 *   create(container, config) — returns a widget instance with:
 *     init()    — one-time setup (DOM skeleton, timers, listeners)
 *     render()  — paint / refresh the widget content
 *     destroy() — tear down timers, listeners, and references
 *   preferredSize — optional default size hints for the layout engine:
 *     { width, height, grow, shrink, span }
 */

/* global AmbientDisplay */
var AmbientDisplay = AmbientDisplay || {};

AmbientDisplay.widgetRegistry = (function () {
  var registry = {};

  /**
   * Register a widget factory under a config type string (e.g. "clock").
   */
  function register(type, factory) {
    if (!type || typeof type !== 'string') {
      return false;
    }

    if (!factory || typeof factory.create !== 'function') {
      return false;
    }

    registry[type] = factory;
    return true;
  }

  /**
   * Look up a registered factory by type. Returns null when unknown.
   */
  function get(type) {
    return registry.hasOwnProperty(type) ? registry[type] : null;
  }

  /**
   * Check whether a type has been registered.
   */
  function has(type) {
    return registry.hasOwnProperty(type);
  }

  return {
    register: register,
    get: get,
    has: has
  };
}());
