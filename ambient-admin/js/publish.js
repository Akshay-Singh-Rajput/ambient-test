/**
 * publish.js — Publish pipeline for Ambient Display Admin
 */

var AmbientAdmin = AmbientAdmin || {};

AmbientAdmin.publish = (function () {
  var PLATFORM_ASSETS = [
    './', './index.html', './cache-manifest.json',
    './css/app.css', './css/themes.css', './css/layouts.css', './css/assets.css',
    './widgets/clock.css',
    './js/storage.js', './js/config-loader.js', './js/theme-engine.js',
    './js/layout-engine.js', './js/asset-manager.js', './js/widget-registry.js',
    './js/renderer.js', './js/scheduler.js', './js/sw-register.js', './js/app.js',
    './widgets/clock.js', './config/config.json', './service-worker.js'
  ];

  function generateManifest(config, uploadedAssets) {
    var assets = PLATFORM_ASSETS.slice();
    uploadedAssets.forEach(function (asset) {
      assets.push('./' + asset.publishPath);
    });
    return { version: config.version, assets: assets };
  }

  function downloadFile(filename, content, mime) {
    var blob = new Blob([content], { type: mime || 'application/json' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function renderStatus(container, result) {
    container.innerHTML = '';
    if (result.valid) {
      container.innerHTML = '<p class="admin-status admin-status--ok">Config is valid and ready to publish.</p>';
      return;
    }
    var list = document.createElement('ul');
    list.className = 'admin-status admin-status--error';
    result.errors.forEach(function (error) {
      var item = document.createElement('li');
      item.textContent = error.path + ': ' + error.message;
      list.appendChild(item);
    });
    container.appendChild(list);
  }

  function validateAndShow() {
    var result = AmbientAdmin.validator.validate(AmbientAdmin.configModel.getConfig());
    renderStatus(document.getElementById('publish-status'), result);
    return result;
  }

  function writeFileHandle(handle, content) {
    return handle.createWritable().then(function (writable) {
      return writable.write(content).then(function () {
        return writable.close();
      });
    });
  }

  function getOrCreateDir(root, parts) {
    var chain = Promise.resolve(root);
    parts.forEach(function (part) {
      chain = chain.then(function (dir) {
        return dir.getDirectoryHandle(part, { create: true });
      });
    });
    return chain;
  }

  function publishToDisplayFolder() {
    var config = AmbientAdmin.configModel.getConfig();
    var validation = AmbientAdmin.validator.validate(config);

    if (!validation.valid) {
      renderStatus(document.getElementById('publish-status'), validation);
      return Promise.reject(new Error('Validation failed'));
    }

    return AmbientAdmin.assetLibrary.listAssets().then(function (uploadedAssets) {
      var configJson = JSON.stringify(config, null, 2) + '\n';
      var manifestJson = JSON.stringify(generateManifest(config, uploadedAssets), null, 2) + '\n';
      var hint = document.getElementById('publish-hint');

      if (!window.showDirectoryPicker) {
        downloadFile('config.json', configJson);
        downloadFile('cache-manifest.json', manifestJson);
        hint.textContent = 'Downloads started. Or run: node scripts/publish.js from ambient-admin/';
        return;
      }

      return window.showDirectoryPicker().then(function (dirHandle) {
        return getOrCreateDir(dirHandle, ['config']).then(function (configDir) {
          return configDir.getFileHandle('config.json', { create: true }).then(function (fh) {
            return writeFileHandle(fh, configJson);
          });
        }).then(function () {
          return dirHandle.getFileHandle('cache-manifest.json', { create: true }).then(function (fh) {
            return writeFileHandle(fh, manifestJson);
          });
        }).then(function () {
          var chain = Promise.resolve();
          uploadedAssets.forEach(function (asset) {
            chain = chain.then(function () {
              var parts = asset.publishPath.split('/');
              var fileName = parts.pop();
              return getOrCreateDir(dirHandle, parts).then(function (folder) {
                return folder.getFileHandle(fileName, { create: true }).then(function (fh) {
                  return writeFileHandle(fh, asset.blob);
                });
              });
            });
          });
          return chain;
        }).then(function () {
          hint.textContent = 'Published successfully. Reload the display to apply changes.';
        });
      });
    });
  }

  function switchPanel(panelId) {
    document.querySelectorAll('.admin-nav__item').forEach(function (item) {
      item.classList.toggle('admin-nav__item--active', item.dataset.panel === panelId);
    });
    document.querySelectorAll('.admin-panel').forEach(function (panel) {
      panel.classList.remove('admin-panel--active');
    });
    document.getElementById('panel-' + panelId).classList.add('admin-panel--active');
  }

  function bind() {
    document.getElementById('btn-validate').addEventListener('click', validateAndShow);

    document.getElementById('btn-download-config').addEventListener('click', function () {
      downloadFile('config.json', JSON.stringify(AmbientAdmin.configModel.getConfig(), null, 2) + '\n');
    });

    document.getElementById('btn-download-manifest').addEventListener('click', function () {
      AmbientAdmin.assetLibrary.listAssets().then(function (assets) {
        var manifest = generateManifest(AmbientAdmin.configModel.getConfig(), assets);
        downloadFile('cache-manifest.json', JSON.stringify(manifest, null, 2) + '\n');
      });
    });

    document.getElementById('btn-write-display').addEventListener('click', function () {
      publishToDisplayFolder().catch(function (error) {
        document.getElementById('publish-hint').textContent = error.message;
      });
    });

    document.getElementById('btn-publish').addEventListener('click', function () {
      switchPanel('publish');
      publishToDisplayFolder();
    });
  }

  return {
    bind: bind,
    validateAndShow: validateAndShow,
    generateManifest: generateManifest
  };
})();
