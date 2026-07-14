/**
 * validator.js — Config validator for Ambient Display Admin
 *
 * Ensures draft config matches the display platform contract before publish.
 */

var AmbientAdmin = AmbientAdmin || {};

AmbientAdmin.validator = (function () {
  var THEMES = ['light', 'dark', 'midnight', 'minimal'];
  var LAYOUTS = ['center', 'stack', 'grid', 'fullscreen', 'top-bottom'];
  var SCENES = ['morning', 'day', 'evening', 'night'];
  var WIDGETS = ['clock'];
  var TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

  function pushError(errors, path, message) {
    errors.push({ path: path, message: message });
  }

  function validateTime(value, path, errors) {
    if (!TIME_PATTERN.test(value)) {
      pushError(errors, path, 'Must be HH:MM (24-hour)');
    }
  }

  function validateTheme(theme, path, errors) {
    if (!theme || !theme.name || THEMES.indexOf(theme.name) === -1) {
      pushError(errors, path + '.name', 'Theme must be one of: ' + THEMES.join(', '));
    }
  }

  function validateLayout(layout, path, errors) {
    if (!layout || !layout.type || LAYOUTS.indexOf(layout.type) === -1) {
      pushError(errors, path + '.type', 'Layout must be one of: ' + LAYOUTS.join(', '));
    }
  }

  function validateWidget(widget, path, errors) {
    if (!widget.type || WIDGETS.indexOf(widget.type) === -1) {
      pushError(errors, path + '.type', 'Unknown widget type: ' + (widget.type || '(missing)'));
    }

    if (!widget.id) {
      pushError(errors, path + '.id', 'Widget id is required');
    }
  }

  function validate(config) {
    var errors = [];
    var sceneStarts = {};
    var i;
    var scene;
    var widget;
    var j;

    if (!config.version) {
      pushError(errors, 'version', 'Version is required');
    }

    if (config.scheduler && config.scheduler.enabled) {
      if (!Array.isArray(config.scheduler.scenes) || !config.scheduler.scenes.length) {
        pushError(errors, 'scheduler.scenes', 'At least one scene is required when scheduler is enabled');
      } else {
        for (i = 0; i < config.scheduler.scenes.length; i++) {
          scene = config.scheduler.scenes[i];

          if (SCENES.indexOf(scene.id) === -1) {
            pushError(errors, 'scheduler.scenes[' + i + '].id', 'Unknown scene id: ' + scene.id);
          }

          validateTime(scene.start, 'scheduler.scenes[' + i + '].start', errors);

          if (sceneStarts[scene.start]) {
            pushError(errors, 'scheduler.scenes[' + i + '].start', 'Duplicate start time: ' + scene.start);
          }

          sceneStarts[scene.start] = true;
          validateTheme(scene.theme, 'scheduler.scenes[' + i + '].theme', errors);
          validateLayout(scene.layout, 'scheduler.scenes[' + i + '].layout', errors);

          if (Array.isArray(scene.widgets)) {
            for (j = 0; j < scene.widgets.length; j++) {
              validateWidget(scene.widgets[j], 'scheduler.scenes[' + i + '].widgets[' + j + ']', errors);
            }
          }
        }
      }
    }

    validateTheme(config.theme, 'theme', errors);
    validateLayout(config.layout, 'layout', errors);

    if (Array.isArray(config.widgets)) {
      for (i = 0; i < config.widgets.length; i++) {
        validateWidget(config.widgets[i], 'widgets[' + i + ']', errors);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  return { validate: validate };
})();
