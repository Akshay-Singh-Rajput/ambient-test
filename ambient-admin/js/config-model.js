/**
 * config-model.js — Config state (ES6 module)
 */

import { storage } from './storage.js';

const SCENE_IDS = ['morning', 'day', 'evening', 'night'];
const DEFAULT_BOUNDARIES = { morning: '05:00', day: '09:00', evening: '17:00', night: '21:00' };

const listeners = [];
let config = null;

const defaultClockWidget = (id, hourFormat, showSeconds) => ({
  type: 'clock',
  id,
  size: { width: 'auto', height: 'auto' },
  options: {
    showSeconds: showSeconds !== false,
    showDate: true,
    hourFormat: hourFormat || '12',
    timezone: 'Asia/Kolkata'
  }
});

const defaultScene = (id) => {
  const themes = { morning: 'light', day: 'light', evening: 'dark', night: 'midnight' };
  const formats = { morning: '12', day: '24', evening: '12', night: '12' };
  return {
    id,
    start: DEFAULT_BOUNDARIES[id],
    theme: { name: themes[id] || 'dark' },
    layout: { type: 'center', gap: '2rem', padding: '2rem', columns: 2 },
    widgets: [defaultClockWidget(`${id}-clock`, formats[id], true)]
  };
};

const notify = () => listeners.forEach((fn) => fn(configModel.getConfig()));

export const configModel = {
  SCENE_IDS,

  createDefaultConfig() {
    return {
      version: '1.0.0',
      scheduler: { enabled: true, scenes: SCENE_IDS.map(defaultScene) },
      theme: { name: 'dark' },
      layout: { type: 'center', gap: '2rem', padding: '2rem', columns: 2 },
      widgets: [defaultClockWidget('primary-clock', '12', true)]
    };
  },

  init(initial) {
    config = initial || configModel.createDefaultConfig();
    notify();
    return config;
  },

  getConfig() {
    return JSON.parse(JSON.stringify(config));
  },

  setConfig(next) {
    config = JSON.parse(JSON.stringify(next));
    storage.saveDraft(config);
    notify();
  },

  update(path, value) {
    const parts = path.split('.');
    let cursor = config;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cursor[parts[i]]) cursor[parts[i]] = {};
      cursor = cursor[parts[i]];
    }
    cursor[parts[parts.length - 1]] = value;
    storage.saveDraft(config);
    notify();
  },

  getScene(sceneId) {
    return (config.scheduler?.scenes || []).find((s) => s.id === sceneId);
  },

  updateScene(sceneId, patch) {
    const scenes = config.scheduler?.scenes || [];
    const index = scenes.findIndex((s) => s.id === sceneId);
    if (index === -1) return;
    Object.assign(scenes[index], patch);
    config.scheduler.scenes = scenes;
    storage.saveDraft(config);
    notify();
  },

  onChange(callback) {
    listeners.push(callback);
  }
};
