/**
 * detail.js — Fullscreen card detail view with back navigation (ES5)
 */

/* global AmbientDisplay */
var AmbientDisplay = AmbientDisplay || {};

AmbientDisplay.detail = (function () {
  var overlay = null;
  var panel = null;
  var body = null;
  var backBtn = null;
  var titleEl = null;
  var activeCard = null;
  var activeInstance = null;
  var appConfig = null;
  var onClose = null;

  function close() {
    if (activeInstance && typeof activeInstance.destroyDetail === 'function') {
      activeInstance.destroyDetail();
    }

    if (overlay) {
      overlay.className = overlay.className.replace(' ambient-detail--open', '');
    }

    if (document.body) {
      document.body.className = document.body.className.replace(' ambient-body--detail', '');
    }

    AmbientDisplay.cardUtils.clearEl(body);
    activeCard = null;
    activeInstance = null;

    if (typeof onClose === 'function') {
      onClose();
    }
  }

  function open(cardConfig, fullConfig) {
    var instance;

    if (!cardConfig || !AmbientDisplay.cardRegistry.has(cardConfig.type)) {
      return;
    }

    if (activeInstance && typeof activeInstance.destroyDetail === 'function') {
      activeInstance.destroyDetail();
    }

    appConfig = fullConfig;
    activeCard = cardConfig;
    instance = AmbientDisplay.cardRegistry.create(cardConfig.type);

    if (!instance || typeof instance.renderDetail !== 'function') {
      return;
    }

    activeInstance = instance;
    titleEl.textContent = cardConfig.title || cardConfig.type;
    AmbientDisplay.cardUtils.clearEl(body);
    instance.renderDetail(body, fullConfig, cardConfig);

    overlay.className += ' ambient-detail--open';
    document.body.className += ' ambient-body--detail';
  }

  function mount(container, closeCallback) {
    onClose = closeCallback;

    overlay = document.createElement('div');
    overlay.className = 'ambient-detail';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    panel = document.createElement('div');
    panel.className = 'ambient-detail__panel';

    var header = document.createElement('div');
    header.className = 'ambient-detail__header';

    backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'ambient-detail__back';
    backBtn.setAttribute('aria-label', 'Back to home');
    backBtn.appendChild(document.createTextNode('Back'));

    titleEl = document.createElement('h2');
    titleEl.className = 'ambient-detail__title';

    header.appendChild(backBtn);
    header.appendChild(titleEl);

    body = document.createElement('div');
    body.className = 'ambient-detail__body';

    panel.appendChild(header);
    panel.appendChild(body);
    overlay.appendChild(panel);
    container.appendChild(overlay);

    backBtn.addEventListener('click', close, false);
  }

  function destroy() {
    close();
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
    overlay = null;
    panel = null;
    body = null;
  }

  return {
    mount: mount,
    open: open,
    close: close,
    destroy: destroy
  };
}());
