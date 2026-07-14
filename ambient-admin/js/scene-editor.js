/**
 * scene-editor.js — Scene and widget editor UI for Ambient Display Admin
 */

var AmbientAdmin = AmbientAdmin || {};

AmbientAdmin.sceneEditor = (function () {
  var THEMES = ['light', 'dark', 'midnight', 'minimal'];
  var LAYOUTS = ['center', 'stack', 'grid', 'fullscreen', 'top-bottom'];
  var activeSceneId = 'morning';

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function renderTimeline(container) {
    var config = AmbientAdmin.configModel.getConfig();
    var scenes = config.scheduler.scenes || [];

    container.innerHTML = '';

    scenes.forEach(function (scene) {
      var btn = el('button', 'admin-timeline__item');
      btn.type = 'button';
      btn.textContent = scene.id + ' · ' + scene.start;
      btn.dataset.sceneId = scene.id;

      if (scene.id === activeSceneId) {
        btn.classList.add('admin-timeline__item--active');
      }

      btn.addEventListener('click', function () {
        activeSceneId = scene.id;
        renderTimeline(container);
        renderSceneEditor(document.getElementById('scene-editor'));
      });

      container.appendChild(btn);
    });
  }

  function field(labelText, inputEl) {
    var wrap = el('div', 'admin-field');
    var label = el('label', 'admin-field__label', labelText);
    wrap.appendChild(label);
    wrap.appendChild(inputEl);
    return wrap;
  }

  function selectOptions(values, selected) {
    var select = el('select', 'admin-input');
    values.forEach(function (value) {
      var opt = el('option', '', value);
      opt.value = value;
      if (value === selected) opt.selected = true;
      select.appendChild(opt);
    });
    return select;
  }

  function renderSceneEditor(container) {
    var scene = AmbientAdmin.configModel.getScene(activeSceneId);
    if (!scene) return;

    container.innerHTML = '';
    container.appendChild(el('h3', 'admin-card__title', 'Edit: ' + scene.id));

    var startInput = el('input', 'admin-input');
    startInput.type = 'time';
    startInput.value = scene.start;

    var themeSelect = selectOptions(THEMES, scene.theme.name);
    var layoutSelect = selectOptions(LAYOUTS, scene.layout.type);

    var widget = scene.widgets[0] || {};
    var options = widget.options || {};

    var hourFormatSelect = selectOptions(['12', '24'], options.hourFormat || '12');
    var timezoneInput = el('input', 'admin-input');
    timezoneInput.value = options.timezone || 'Asia/Kolkata';

    var showSeconds = el('input');
    showSeconds.type = 'checkbox';
    showSeconds.checked = options.showSeconds !== false;

    var showDate = el('input');
    showDate.type = 'checkbox';
    showDate.checked = options.showDate !== false;

    function saveScene() {
      AmbientAdmin.configModel.updateScene(activeSceneId, {
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
          id: scene.id + '-clock',
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
    }

    startInput.addEventListener('change', saveScene);
    themeSelect.addEventListener('change', saveScene);
    layoutSelect.addEventListener('change', saveScene);
    hourFormatSelect.addEventListener('change', saveScene);
    timezoneInput.addEventListener('change', saveScene);
    showSeconds.addEventListener('change', saveScene);
    showDate.addEventListener('change', saveScene);

    container.appendChild(field('Start time', startInput));
    container.appendChild(field('Theme', themeSelect));
    container.appendChild(field('Layout', layoutSelect));
    container.appendChild(el('hr', 'admin-divider'));
    container.appendChild(el('h4', 'admin-card__subtitle', 'Clock widget'));
    container.appendChild(field('Hour format', hourFormatSelect));
    container.appendChild(field('Timezone', timezoneInput));
    container.appendChild(field('Show seconds', showSeconds));
    container.appendChild(field('Show date', showDate));
  }

  function renderDefaults(container) {
    var config = AmbientAdmin.configModel.getConfig();

    container.innerHTML = '';
    container.appendChild(el('h3', 'admin-card__title', 'Fallback theme & layout'));

    var versionInput = el('input', 'admin-input');
    versionInput.value = config.version;

    var themeSelect = selectOptions(THEMES, config.theme.name);
    var layoutSelect = selectOptions(LAYOUTS, config.layout.type);

    function save() {
      AmbientAdmin.configModel.update('version', versionInput.value);
      AmbientAdmin.configModel.update('theme.name', themeSelect.value);
      AmbientAdmin.configModel.update('layout.type', layoutSelect.value);
    }

    versionInput.addEventListener('change', save);
    themeSelect.addEventListener('change', save);
    layoutSelect.addEventListener('change', save);

    container.appendChild(field('Version', versionInput));
    container.appendChild(field('Theme', themeSelect));
    container.appendChild(field('Layout', layoutSelect));
  }

  function init() {
    renderTimeline(document.getElementById('scene-timeline'));
    renderSceneEditor(document.getElementById('scene-editor'));
    renderDefaults(document.getElementById('defaults-editor'));

    document.getElementById('scheduler-enabled').checked =
      AmbientAdmin.configModel.getConfig().scheduler.enabled;

    document.getElementById('scheduler-enabled').addEventListener('change', function (event) {
      AmbientAdmin.configModel.update('scheduler.enabled', event.target.checked);
    });

    AmbientAdmin.configModel.onChange(function () {
      document.getElementById('scheduler-enabled').checked =
        AmbientAdmin.configModel.getConfig().scheduler.enabled;
      renderTimeline(document.getElementById('scene-timeline'));
      renderSceneEditor(document.getElementById('scene-editor'));
      renderDefaults(document.getElementById('defaults-editor'));
    });
  }

  return { init: init, renderTimeline: renderTimeline };
})();
