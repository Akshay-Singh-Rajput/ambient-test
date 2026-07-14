/**
 * scripts/publish.js — Node publish script for Ambient Display Admin
 *
 * Writes draft config and exported assets to ambient-display/ without a browser.
 * Usage: node scripts/publish.js
 */

var fs = require('fs');
var path = require('path');

var ADMIN_ROOT = path.join(__dirname, '..');
var DISPLAY_ROOT = path.join(ADMIN_ROOT, '..', 'ambient-display');
var EXPORT_DIR = path.join(ADMIN_ROOT, 'export');
var CONFIG_PATH = path.join(EXPORT_DIR, 'config.json');
var ASSETS_DIR = path.join(EXPORT_DIR, 'assets');

var PLATFORM_ASSETS = [
  './', './index.html', './cache-manifest.json',
  './css/app.css', './css/themes.css', './css/layouts.css', './css/assets.css',
  './widgets/clock.css',
  './js/storage.js', './js/config-loader.js', './js/theme-engine.js',
  './js/layout-engine.js', './js/asset-manager.js', './js/widget-registry.js',
  './js/renderer.js', './js/scheduler.js', './js/sw-register.js', './js/app.js',
  './widgets/clock.js', './config/config.json', './service-worker.js'
];

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;

  var stat = fs.statSync(src);

  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(function (entry) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    });
    return;
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function collectAssetPaths(dir, base) {
  var results = [];
  if (!fs.existsSync(dir)) return results;

  fs.readdirSync(dir).forEach(function (entry) {
    var full = path.join(dir, entry);
    var rel = path.join(base, entry).replace(/\\/g, '/');
    if (fs.statSync(full).isDirectory()) {
      results = results.concat(collectAssetPaths(full, rel));
    } else {
      results.push('./' + rel.replace(/\\/g, '/'));
    }
  });

  return results;
}

function main() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error('Missing export/config.json — download it from the admin Publish panel first.');
    process.exit(1);
  }

  var config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  var uploadedPaths = collectAssetPaths(ASSETS_DIR, 'assets');
  var manifest = {
    version: config.version,
    assets: PLATFORM_ASSETS.concat(uploadedPaths)
  };

  fs.mkdirSync(path.join(DISPLAY_ROOT, 'config'), { recursive: true });
  fs.writeFileSync(path.join(DISPLAY_ROOT, 'config', 'config.json'), JSON.stringify(config, null, 2) + '\n');
  fs.writeFileSync(path.join(DISPLAY_ROOT, 'cache-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

  if (fs.existsSync(ASSETS_DIR)) {
    copyRecursive(ASSETS_DIR, path.join(DISPLAY_ROOT, 'assets'));
  }

  console.log('Published v' + config.version + ' to ' + DISPLAY_ROOT);
}

main();
