/**
 * main.js — Admin entry point (ES6 module)
 */

import { storage } from './storage.js';
import { configModel } from './config-model.js';
import { sceneEditor } from './scene-editor.js';
import { assetLibrary } from './asset-library.js';
import { publish } from './publish.js';
import { preview } from './preview.js';

const pad = (n) => (n < 10 ? `0${n}` : String(n));

const tickAdminClock = () => {
  const el = document.getElementById('admin-clock');
  if (!el) return;
  const now = new Date();
  el.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  el.setAttribute('datetime', now.toISOString());
};

const loadDisplayConfig = () =>
  fetch('../ambient-display/config/config.json').then((r) => {
    if (!r.ok) throw new Error('Could not load display config');
    return r.json();
  });

const initDraft = async () => {
  const saved = storage.getDraft();
  if (saved) {
    configModel.init(saved);
    return;
  }
  try {
    configModel.init(await loadDisplayConfig());
  } catch {
    configModel.init(configModel.createDefaultConfig());
  }
};

const bindNavigation = () => {
  document.getElementById('admin-nav')?.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-panel]');
    if (!btn) return;

    document.querySelectorAll('.admin-nav__item').forEach((item) => {
      item.classList.toggle('admin-nav__item--active', item === btn);
    });
    document.querySelectorAll('.admin-panel').forEach((panel) => {
      panel.classList.toggle('admin-panel--active', panel.id === `panel-${btn.dataset.panel}`);
    });
  });
};

const bindImport = () => {
  const input = document.getElementById('import-input');
  document.getElementById('btn-import')?.addEventListener('click', () => input?.click());

  input?.addEventListener('change', () => {
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        configModel.setConfig(JSON.parse(reader.result));
      } catch {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
    input.value = '';
  });
};

const updateDraftStatus = () => {
  const el = document.getElementById('draft-status');
  const ts = storage.getDraftTimestamp();
  if (!el) return;
  el.textContent = ts ? `Saved ${new Date(ts).toLocaleTimeString()}` : 'Unsaved draft';
};

const init = async () => {
  await initDraft();
  bindNavigation();
  bindImport();

  configModel.onChange(() => {
    updateDraftStatus();
    const previewEl = document.getElementById('config-preview');
    if (previewEl) previewEl.textContent = JSON.stringify(configModel.getConfig(), null, 2);
  });

  sceneEditor.init();
  assetLibrary.bindUpload(
    document.getElementById('asset-dropzone'),
    document.getElementById('asset-input'),
    document.getElementById('asset-grid')
  );
  publish.bind();
  preview.bind();
  publish.validateAndShow();
  updateDraftStatus();

  tickAdminClock();
  setInterval(tickAdminClock, 1000);
};

init();
