/**
 * publish.js — Publish pipeline (ES6 module)
 */

import { configModel } from './config-model.js';
import { validator } from './validator.js';
import { assetLibrary } from './asset-library.js';

const PLATFORM_ASSETS = [
  './', './index.html', './cache-manifest.json',
  './css/app.css', './css/themes.css', './css/layouts.css', './css/assets.css',
  './cards/cards.css', './cards/clock.css', './cards/greeting.css',
  './cards/quote.css', './cards/countdown.css', './cards/status.css',
  './cards/card-utils.js', './cards/clock.js', './cards/greeting.js',
  './cards/quote.js', './cards/countdown.js', './cards/photo.js', './cards/status.js',
  './js/storage.js', './js/config-loader.js', './js/theme-engine.js',
  './js/layout-engine.js', './js/asset-manager.js', './js/card-registry.js',
  './js/scene-loader.js', './js/scene.js', './js/scene-manager.js',
  './js/renderer.js', './js/sw-register.js',
  './js/refresh-control.js', './js/app.js',
  './css/scenes.css',
  './config/config.json', './service-worker.js'
];

const downloadFile = (filename, content) => {
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const writeFileHandle = (handle, content) =>
  handle.createWritable().then((w) => w.write(content).then(() => w.close()));

const getOrCreateDir = (root, parts) =>
  parts.reduce((chain, part) => chain.then((dir) => dir.getDirectoryHandle(part, { create: true })), Promise.resolve(root));

const renderStatus = (container, result) => {
  container.innerHTML = result.valid
    ? '<p class="admin-status admin-status--ok">Config is valid and ready to publish.</p>'
    : `<ul class="admin-status admin-status--error">${result.errors.map((e) => `<li>${e.path}: ${e.message}</li>`).join('')}</ul>`;
};

export const publish = {
  generateManifest(config, uploadedAssets) {
    return {
      version: config.version,
      assets: [...PLATFORM_ASSETS, ...uploadedAssets.map((a) => `./${a.publishPath}`)]
    };
  },

  validateAndShow() {
    const result = validator.validate(configModel.getConfig());
    renderStatus(document.getElementById('publish-status'), result);
    return result;
  },

  async publishToDisplayFolder() {
    const config = configModel.getConfig();
    const validation = validator.validate(config);
    if (!validation.valid) {
      renderStatus(document.getElementById('publish-status'), validation);
      throw new Error('Validation failed');
    }

    const uploadedAssets = await assetLibrary.listAssets();
    const configJson = `${JSON.stringify(config, null, 2)}\n`;
    const manifestJson = `${JSON.stringify(publish.generateManifest(config, uploadedAssets), null, 2)}\n`;
    const hint = document.getElementById('publish-hint');

    if (!window.showDirectoryPicker) {
      downloadFile('config.json', configJson);
      downloadFile('cache-manifest.json', manifestJson);
      hint.textContent = 'Downloads started. Or run: node scripts/publish.js from ambient-admin/';
      return;
    }

    const dirHandle = await window.showDirectoryPicker();
    const configDir = await dirHandle.getDirectoryHandle('config', { create: true });
    await writeFileHandle(await configDir.getFileHandle('config.json', { create: true }), configJson);
    await writeFileHandle(await dirHandle.getFileHandle('cache-manifest.json', { create: true }), manifestJson);

    for (const asset of uploadedAssets) {
      const parts = asset.publishPath.split('/');
      const fileName = parts.pop();
      const folder = await getOrCreateDir(dirHandle, parts);
      await writeFileHandle(await folder.getFileHandle(fileName, { create: true }), asset.blob);
    }

    hint.textContent = 'Published successfully. Reload the display to apply changes.';
  },

  bind() {
    document.getElementById('btn-validate')?.addEventListener('click', () => publish.validateAndShow());

    document.getElementById('btn-download-config')?.addEventListener('click', () => {
      downloadFile('config.json', `${JSON.stringify(configModel.getConfig(), null, 2)}\n`);
    });

    document.getElementById('btn-download-manifest')?.addEventListener('click', async () => {
      const assets = await assetLibrary.listAssets();
      downloadFile('cache-manifest.json', `${JSON.stringify(publish.generateManifest(configModel.getConfig(), assets), null, 2)}\n`);
    });

    document.getElementById('btn-write-display')?.addEventListener('click', () => {
      publish.publishToDisplayFolder().catch((e) => {
        document.getElementById('publish-hint').textContent = e.message;
      });
    });

    document.getElementById('btn-publish')?.addEventListener('click', () => {
      document.querySelector('[data-panel="publish"]')?.click();
      publish.publishToDisplayFolder().catch((e) => {
        document.getElementById('publish-hint').textContent = e.message;
      });
    });
  }
};
