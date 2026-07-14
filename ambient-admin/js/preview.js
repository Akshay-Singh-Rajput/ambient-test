/**
 * preview.js — Live user-display preview via postMessage (ES6 module)
 */

import { configModel } from './config-model.js';

const PREVIEW_URL = '../ambient-display/index.html?preview=1';
let iframe = null;
let forceSceneSelect = null;
let syncStatusEl = null;
let debounceTimer = null;

const formatSyncTime = (date) =>
  date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });

export const preview = {
  sendConfig() {
    const frame = iframe ?? document.getElementById('display-preview-frame');
    if (!frame?.contentWindow) return;

    frame.contentWindow.postMessage({
      type: 'ambient:preview-config',
      config: configModel.getConfig(),
      forceScene: forceSceneSelect?.value || null
    }, '*');

    if (syncStatusEl) {
      syncStatusEl.textContent = `Synced ${formatSyncTime(new Date())}`;
      syncStatusEl.classList.add('admin-preview-sidebar__status--ok');
    }
  },

  scheduleSend() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => this.sendConfig(), 120);
  },

  bind() {
    iframe = document.getElementById('display-preview-frame');
    forceSceneSelect = document.getElementById('preview-scene-select');
    syncStatusEl = document.getElementById('preview-sync-status');

    iframe?.addEventListener('load', () => this.sendConfig());
    forceSceneSelect?.addEventListener('change', () => this.sendConfig());
    document.getElementById('btn-preview-refresh')?.addEventListener('click', () => this.sendConfig());

    configModel.onChange(() => this.scheduleSend());
  }
};

export { PREVIEW_URL };
