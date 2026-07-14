/**
 * validator.js — Config validator (ES6 module)
 */

const THEMES = ['light', 'dark', 'midnight', 'minimal'];
const LAYOUTS = ['center', 'stack', 'grid', 'fullscreen', 'top-bottom'];
const SCENES = ['morning', 'day', 'evening', 'night'];
const WIDGETS = ['clock'];
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const pushError = (errors, path, message) => errors.push({ path, message });

export const validator = {
  validate(config) {
    const errors = [];
    const sceneStarts = {};

    if (!config.version) pushError(errors, 'version', 'Version is required');

    if (config.scheduler?.enabled) {
      if (!Array.isArray(config.scheduler.scenes) || !config.scheduler.scenes.length) {
        pushError(errors, 'scheduler.scenes', 'At least one scene is required when scheduler is enabled');
      } else {
        config.scheduler.scenes.forEach((scene, i) => {
          if (!SCENES.includes(scene.id)) {
            pushError(errors, `scheduler.scenes[${i}].id`, `Unknown scene id: ${scene.id}`);
          }
          if (!TIME_PATTERN.test(scene.start)) {
            pushError(errors, `scheduler.scenes[${i}].start`, 'Must be HH:MM (24-hour)');
          }
          if (sceneStarts[scene.start]) {
            pushError(errors, `scheduler.scenes[${i}].start`, `Duplicate start time: ${scene.start}`);
          }
          sceneStarts[scene.start] = true;
          if (!scene.theme?.name || !THEMES.includes(scene.theme.name)) {
            pushError(errors, `scheduler.scenes[${i}].theme.name`, `Theme must be one of: ${THEMES.join(', ')}`);
          }
          if (!scene.layout?.type || !LAYOUTS.includes(scene.layout.type)) {
            pushError(errors, `scheduler.scenes[${i}].layout.type`, `Layout must be one of: ${LAYOUTS.join(', ')}`);
          }
          (scene.widgets || []).forEach((widget, j) => {
            if (!widget.type || !WIDGETS.includes(widget.type)) {
              pushError(errors, `scheduler.scenes[${i}].widgets[${j}].type`, `Unknown widget type: ${widget.type || '(missing)'}`);
            }
            if (!widget.id) pushError(errors, `scheduler.scenes[${i}].widgets[${j}].id`, 'Widget id is required');
          });
        });
      }
    }

    if (!config.theme?.name || !THEMES.includes(config.theme.name)) {
      pushError(errors, 'theme.name', `Theme must be one of: ${THEMES.join(', ')}`);
    }
    if (!config.layout?.type || !LAYOUTS.includes(config.layout.type)) {
      pushError(errors, 'layout.type', `Layout must be one of: ${LAYOUTS.join(', ')}`);
    }
    (config.widgets || []).forEach((widget, i) => {
      if (!widget.type || !WIDGETS.includes(widget.type)) {
        pushError(errors, `widgets[${i}].type`, `Unknown widget type: ${widget.type || '(missing)'}`);
      }
      if (!widget.id) pushError(errors, `widgets[${i}].id`, 'Widget id is required');
    });

    return { valid: errors.length === 0, errors };
  }
};
