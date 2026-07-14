/**
 * preview.js — Live display preview for Ambient Display Admin
 *
 * Sends draft config to the display test harness via postMessage so admin
 * edits reflect on the user-side renderer without publishing.
 */

var AmbientAdmin = AmbientAdmin || {};

AmbientAdmin.preview = (function () {
  var HARNESS_URL = '../ambient-display/test/index.html?preview=1';
  var iframe = null;
  var forceSceneSelect = null;

  function getIframe() {
    return document.getElementById('display-preview-frame');
  }

  function sendConfig() {
    var frame = getIframe();

    if (!frame || !frame.contentWindow) {
      return;
    }

    frame.contentWindow.postMessage({
      type: 'ambient:preview-config',
      config: AmbientAdmin.configModel.getConfig(),
      forceScene: forceSceneSelect ? forceSceneSelect.value : null
    }, '*');
  }

  function bind() {
    iframe = getIframe();
    forceSceneSelect = document.getElementById('preview-scene-select');

    iframe.addEventListener('load', sendConfig);

    if (forceSceneSelect) {
      forceSceneSelect.addEventListener('change', sendConfig);
    }

    document.getElementById('btn-preview-refresh').addEventListener('click', sendConfig);

    AmbientAdmin.configModel.onChange(function () {
      sendConfig();
    });
  }

  return { bind: bind, sendConfig: sendConfig };
})();
