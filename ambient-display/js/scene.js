/**
 * scene.js — Scene instance with lifecycle: load, activate, deactivate, destroy (ES5)
 *
 * A scene owns layout, theme, background, transition, and card mounting.
 * Card rendering lives here — the platform renderer never touches cards.
 */

/* global AmbientDisplay */
var AmbientDisplay = AmbientDisplay || {};

AmbientDisplay.Scene = (function () {
  function createCardSlot(cardConfig) {
    var container = document.createElement('div');
    var type = cardConfig.type || 'unknown';

    container.className = 'ambient-card ambient-card--' + type;
    container.setAttribute('data-card-type', type);

    if (cardConfig.id) {
      container.setAttribute('data-card-id', cardConfig.id);
    }

    return container;
  }

  function renderUnknownCard(container, type) {
    container.className += ' ambient-card--unknown';
    container.appendChild(document.createTextNode('Unknown card type: ' + type));
  }

  function mountCard(cardConfig, activeInstances) {
    var type = cardConfig && cardConfig.type ? cardConfig.type : null;
    var container;
    var instance;

    if (!type) {
      return null;
    }

    container = createCardSlot(cardConfig);
    instance = AmbientDisplay.cardRegistry.create(type);

    if (AmbientDisplay.layoutEngine) {
      if (typeof AmbientDisplay.layoutEngine.applyCardSize === 'function') {
        AmbientDisplay.layoutEngine.applyCardSize(container, cardConfig, null);
      }
      if (typeof AmbientDisplay.layoutEngine.applyDashboardArea === 'function') {
        AmbientDisplay.layoutEngine.applyDashboardArea(container, type, cardConfig);
      }
    }

    if (instance) {
      instance.init(cardConfig);
      instance.render(container);
      activeInstances.push({ instance: instance, container: container });
    } else {
      renderUnknownCard(container, type);
    }

    return container;
  }

  function destroyCardInstances(activeInstances) {
    var i;
    var entry;

    for (i = 0; i < activeInstances.length; i++) {
      entry = activeInstances[i];
      if (entry && entry.instance && typeof entry.instance.destroy === 'function') {
        entry.instance.destroy();
      }
    }
  }

  function applyBackground(shell, background) {
    shell.className = shell.className.replace(/ ambient-scene--bg-\S+/g, '');

    if (!background) {
      shell.style.background = '';
      shell.style.backgroundImage = '';
      return;
    }

    if (background.type === 'image') {
      shell.style.backgroundImage = 'url(' + background.value + ')';
      shell.style.backgroundSize = 'cover';
      shell.style.backgroundPosition = 'center';
      return;
    }

    shell.style.background = background.value;
  }

  function create(definition) {
    var config = definition;
    var activeInstances = [];
    var mountRoot = null;
    var sceneShell = null;
    var layoutContainer = null;
    var isActive = false;
    var isLoaded = false;
    var scene = null;

    scene = {
      getId: function () {
        return config ? config.id : null;
      },

      getName: function () {
        return config ? config.name : null;
      },

      getConfig: function () {
        return config;
      },

      load: function () {
        if (!config) {
          return false;
        }
        isLoaded = true;
        return true;
      },

      activate: function (rootElement) {
        var i;
        var cardNode;

        if (!config || !rootElement) {
          return false;
        }

        if (!isLoaded) {
          scene.load();
        }

        if (isActive && mountRoot === rootElement && sceneShell && sceneShell.parentNode === rootElement) {
          return true;
        }

        scene.deactivate();
        mountRoot = rootElement;

        while (mountRoot.firstChild) {
          mountRoot.removeChild(mountRoot.firstChild);
        }

        if (AmbientDisplay.themeEngine && typeof AmbientDisplay.themeEngine.apply === 'function') {
          AmbientDisplay.themeEngine.apply(config.theme);
        }

        sceneShell = document.createElement('div');
        sceneShell.className = 'ambient-scene ambient-scene--' + config.id;
        sceneShell.setAttribute('data-scene-id', config.id);

        if (config.transition && config.transition !== 'none') {
          sceneShell.className += ' ambient-scene--transition-' + config.transition;
        }

        applyBackground(sceneShell, config.background);

        layoutContainer = AmbientDisplay.layoutEngine.createLayoutContainer(config.layout);

        for (i = 0; i < config.cards.length; i++) {
          cardNode = mountCard(config.cards[i], activeInstances);
          if (cardNode) {
            layoutContainer.appendChild(cardNode);
          }
        }

        sceneShell.appendChild(layoutContainer);
        mountRoot.appendChild(sceneShell);
        isActive = true;
        return true;
      },

      deactivate: function () {
        if (!isActive) {
          return;
        }

        destroyCardInstances(activeInstances);
        activeInstances = [];

        if (AmbientDisplay.assetManager && typeof AmbientDisplay.assetManager.releaseAll === 'function') {
          AmbientDisplay.assetManager.releaseAll();
        }

        if (sceneShell && sceneShell.parentNode) {
          sceneShell.parentNode.removeChild(sceneShell);
        }

        sceneShell = null;
        layoutContainer = null;
        isActive = false;
      },

      destroy: function () {
        scene.deactivate();
        isLoaded = false;
        mountRoot = null;
        config = null;
      }
    };

    return scene;
  }

  return {
    create: create
  };
}());
