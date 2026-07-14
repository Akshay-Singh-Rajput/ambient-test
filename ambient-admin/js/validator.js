/**
 * validator.js — Config validator (ES6 module)
 */

const THEMES = ['light', 'dark', 'midnight', 'minimal'];
const LAYOUTS = ['center', 'stack', 'grid', 'fullscreen', 'top-bottom', 'dashboard', 'minimal'];
const SCENES = ['morning', 'day', 'evening', 'night'];
const CARD_TYPES = ['clock', 'greeting', 'quote', 'countdown', 'photo', 'status'];
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
          (scene.cards || scene.widgets || []).forEach((card, j) => {
            if (!card.type || !CARD_TYPES.includes(card.type)) {
              pushError(errors, `scheduler.scenes[${i}].cards[${j}].type`, `Unknown card type: ${card.type || '(missing)'}`);
            }
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
    (config.cards || config.widgets || []).forEach((card, i) => {
      if (!card.type || !CARD_TYPES.includes(card.type)) {
        pushError(errors, `cards[${i}].type`, `Unknown card type: ${card.type || '(missing)'}`);
      }
    });

    return { valid: errors.length === 0, errors };
  }
};
