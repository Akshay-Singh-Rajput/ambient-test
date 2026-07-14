/**
 * app.js — Entry point for Ambient Display Admin
 */

(function () {
  var AmbientAdmin = window.AmbientAdmin = window.AmbientAdmin || {};

  function loadDisplayConfig() {
    return fetch('../ambient-display/config/config.json')
      .then(function (response) {
        if (!response.ok) throw new Error('Could not load display config');
        return response.json();
      });
  }

  function initDraft() {
    var saved = AmbientAdmin.storage.getDraft();

    if (saved) {
      AmbientAdmin.configModel.init(saved);
      return;
    }

    loadDisplayConfig()
      .then(function (config) {
        AmbientAdmin.configModel.init(config);
      })
      .catch(function () {
        AmbientAdmin.configModel.init(AmbientAdmin.configModel.createDefaultConfig());
      });
  }

  function bindNavigation() {
    var nav = document.getElementById('admin-nav');

    nav.addEventListener('click', function (event) {
      var btn = event.target.closest('[data-panel]');
      if (!btn) return;

      nav.querySelectorAll('.admin-nav__item').forEach(function (item) {
        item.classList.remove('admin-nav__item--active');
      });
      btn.classList.add('admin-nav__item--active');

      document.querySelectorAll('.admin-panel').forEach(function (panel) {
        panel.classList.remove('admin-panel--active');
      });
      document.getElementById('panel-' + btn.dataset.panel).classList.add('admin-panel--active');
    });
  }

  function bindImport() {
    var input = document.getElementById('import-input');

    document.getElementById('btn-import').addEventListener('click', function () {
      input.click();
    });

    input.addEventListener('change', function () {
      var file = input.files[0];
      if (!file) return;

      var reader = new FileReader();
      reader.onload = function () {
        try {
          var config = JSON.parse(reader.result);
          AmbientAdmin.configModel.setConfig(config);
          AmbientAdmin.sceneEditor.init();
        } catch (error) {
          alert('Invalid JSON file');
        }
      };
      reader.readAsText(file);
      input.value = '';
    });
  }

  function updateDraftStatus() {
    var ts = AmbientAdmin.storage.getDraftTimestamp();
    var el = document.getElementById('draft-status');

    if (!ts) {
      el.textContent = 'Unsaved draft';
      return;
    }

    el.textContent = 'Saved ' + new Date(ts).toLocaleTimeString();
  }

  function init() {
    initDraft();
    bindNavigation();
    bindImport();

    AmbientAdmin.configModel.onChange(function () {
      updateDraftStatus();
      document.getElementById('config-preview').textContent =
        JSON.stringify(AmbientAdmin.configModel.getConfig(), null, 2);
    });

    AmbientAdmin.sceneEditor.init();
    AmbientAdmin.assetLibrary.bindUpload(
      document.getElementById('asset-dropzone'),
      document.getElementById('asset-input'),
      document.getElementById('asset-grid')
    );
    AmbientAdmin.publish.bind();
    AmbientAdmin.publish.validateAndShow();
    updateDraftStatus();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
