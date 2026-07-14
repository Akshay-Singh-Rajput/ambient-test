/**
 * renderer.js — Display renderer for Ambient Display
 *
 * The renderer delegates all painting to the Scene Manager.
 * It never reads cards or layouts — only asks for the current scene.
 */

/* global AmbientDisplay */
var AmbientDisplay = AmbientDisplay || {};

AmbientDisplay.renderer = (function () {
  var rootElement = null;

  function init(element) {
    rootElement = element;

    if (AmbientDisplay.sceneManager && typeof AmbientDisplay.sceneManager.setRoot === 'function') {
      AmbientDisplay.sceneManager.setRoot(element);
    }
  }

  function renderError(message) {
    if (!rootElement) {
      return;
    }

    if (AmbientDisplay.sceneManager && typeof AmbientDisplay.sceneManager.stop === 'function') {
      AmbientDisplay.sceneManager.stop();
    }

    rootElement.innerHTML = '';

    var errorBox = document.createElement('div');
    errorBox.className = 'ambient-error';
    errorBox.appendChild(document.createTextNode(message));
    rootElement.appendChild(errorBox);
  }

  /**
   * Paint the display by ensuring the current scene is active on the root.
   */
  function render() {
    var scene;

    if (!rootElement) {
      return;
    }

    scene = AmbientDisplay.sceneManager.getCurrentScene();

    if (!scene) {
      renderError('No active scene.');
      return;
    }

    scene.activate(rootElement);
  }

  return {
    init: init,
    render: render,
    renderError: renderError
  };
}());

AmbientDisplay.render = AmbientDisplay.renderer.render;
