/**
 * scene-editor.js — Scene editor UI (ES6 module)
 */

import { configModel } from './config-model.js';

const THEMES = ['light', 'dark', 'midnight', 'minimal'];
const LAYOUTS = ['center', 'stack', 'grid', 'fullscreen', 'top-bottom'];
let activeSceneId = 'morning';

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

const field = (labelText, inputEl) => {
  const wrap = el('div', 'admin-field');
  wrap.appendChild(el('label', 'admin-field__label', labelText));
  wrap.appendChild(inputEl);
  return wrap;
};

const selectOptions = (values, selected) => {
  const select = el('select', 'admin-input');
  values.forEach((value) => {
    const opt = el('option', '', value);
    opt.value = value;
    if (value === selected) opt.selected = true;
    select.appendChild(opt);
  });
  return select;
};

const renderTimeline = (container) => {
  const scenes = configModel.getConfig().scheduler?.scenes || [];
  container.innerHTML = '';
  scenes.forEach((scene) => {
    const btn = el('button', 'admin-timeline__item');
    btn.type = 'button';
    btn.textContent = `${scene.id} · ${scene.start}`;
    if (scene.id === activeSceneId) btn.classList.add('admin-timeline__item--active');
    btn.addEventListener('click', () => {
      activeSceneId = scene.id;
      renderTimeline(container);
      renderSceneEditor(document.getElementById('scene-editor'));
    });
    container.appendChild(btn);
  });
};

const renderSceneEditor = (container) => {
  const scene = configModel.getScene(activeSceneId);
  if (!scene) return;

  container.innerHTML = '';
  container.appendChild(el('h3', 'admin-card__title', `Edit: ${scene.id}`));

  const startInput = el('input', 'admin-input');
  startInput.type = 'time';
  startInput.value = scene.start;

  const themeSelect = selectOptions(THEMES, scene.theme.name);
  const layoutSelect = selectOptions(LAYOUTS, scene.layout.type);
  const options = scene.widgets?.[0]?.options || {};
  const hourFormatSelect = selectOptions(['12', '24'], options.hourFormat || '12');
  const timezoneInput = el('input', 'admin-input');
  timezoneInput.value = options.timezone || 'Asia/Kolkata';
  const showSeconds = el('input');
  showSeconds.type = 'checkbox';
  showSeconds.checked = options.showSeconds !== false;
  const showDate = el('input');
  showDate.type = 'checkbox';
  showDate.checked = options.showDate !== false;

  const saveScene = () => {
    configModel.updateScene(activeSceneId, {
      start: startInput.value,
      theme: { name: themeSelect.value },
      layout: {
        type: layoutSelect.value,
        gap: scene.layout.gap || '2rem',
        padding: scene.layout.padding || '2rem',
        columns: scene.layout.columns || 2
      },
      widgets: [{
        type: 'clock',
        id: `${scene.id}-clock`,
        size: { width: 'auto', height: 'auto' },
        options: {
          showSeconds: showSeconds.checked,
          showDate: showDate.checked,
          hourFormat: hourFormatSelect.value,
          timezone: timezoneInput.value
        }
      }]
    });
    renderTimeline(document.getElementById('scene-timeline'));
  };

  [startInput, themeSelect, layoutSelect, hourFormatSelect, timezoneInput, showSeconds, showDate]
    .forEach((input) => input.addEventListener('change', saveScene));

  container.appendChild(field('Start time', startInput));
  container.appendChild(field('Theme', themeSelect));
  container.appendChild(field('Layout', layoutSelect));
  container.appendChild(el('hr', 'admin-divider'));
  container.appendChild(el('h4', 'admin-card__subtitle', 'Clock widget'));
  container.appendChild(field('Hour format', hourFormatSelect));
  container.appendChild(field('Timezone', timezoneInput));
  container.appendChild(field('Show seconds', showSeconds));
  container.appendChild(field('Show date', showDate));
};

const renderDefaults = (container) => {
  const cfg = configModel.getConfig();
  container.innerHTML = '';
  container.appendChild(el('h3', 'admin-card__title', 'Fallback theme & layout'));

  const versionInput = el('input', 'admin-input');
  versionInput.value = cfg.version;
  const themeSelect = selectOptions(THEMES, cfg.theme.name);
  const layoutSelect = selectOptions(LAYOUTS, cfg.layout.type);

  const save = () => {
    configModel.update('version', versionInput.value);
    configModel.update('theme.name', themeSelect.value);
    configModel.update('layout.type', layoutSelect.value);
  };

  [versionInput, themeSelect, layoutSelect].forEach((input) => input.addEventListener('change', save));
  container.appendChild(field('Version', versionInput));
  container.appendChild(field('Theme', themeSelect));
  container.appendChild(field('Layout', layoutSelect));
};

let initialized = false;

export const sceneEditor = {
  init() {
    if (initialized) {
      renderTimeline(document.getElementById('scene-timeline'));
      renderSceneEditor(document.getElementById('scene-editor'));
      renderDefaults(document.getElementById('defaults-editor'));
      return;
    }
    initialized = true;

    renderTimeline(document.getElementById('scene-timeline'));
    renderSceneEditor(document.getElementById('scene-editor'));
    renderDefaults(document.getElementById('defaults-editor'));

    const schedulerToggle = document.getElementById('scheduler-enabled');
    schedulerToggle.checked = configModel.getConfig().scheduler.enabled;
    schedulerToggle.addEventListener('change', (e) => {
      configModel.update('scheduler.enabled', e.target.checked);
    });

    configModel.onChange(() => {
      schedulerToggle.checked = configModel.getConfig().scheduler.enabled;
      renderTimeline(document.getElementById('scene-timeline'));
      renderSceneEditor(document.getElementById('scene-editor'));
      renderDefaults(document.getElementById('defaults-editor'));
    });
  },
  renderTimeline
};
