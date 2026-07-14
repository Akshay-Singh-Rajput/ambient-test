/**
 * card-registry.js — Card type registry (ES5)
 */

/* global AmbientDisplay */
var AmbientDisplay = AmbientDisplay || {};

AmbientDisplay.cardRegistry = (function () {
  var registry = {};

  function register(type, factory) {
    if (!type || typeof factory !== 'function') {
      return false;
    }
    registry[type] = factory;
    return true;
  }

  function create(type) {
    return registry[type] ? registry[type]() : null;
  }

  function has(type) {
    return registry.hasOwnProperty(type);
  }

  return {
    register: register,
    create: create,
    has: has
  };
}());
