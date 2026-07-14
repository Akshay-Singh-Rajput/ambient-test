/**
 * home.js — Home screen card grid (ES5)
 */

/* global AmbientDisplay */
var AmbientDisplay = AmbientDisplay || {};

AmbientDisplay.home = (function () {
  var grid = null;
  var instances = [];
  var onCardOpen = null;

  function handleTileClick(cardConfig) {
    return function () {
      if (typeof onCardOpen === 'function') {
        onCardOpen(cardConfig);
      }
    };
  }

  function mount(container, fullConfig, openCallback) {
    var i;
    var cardConfig;
    var tile;
    var instance;

    onCardOpen = openCallback;
    instances = [];

    grid = document.createElement('main');
    grid.className = 'ambient-home';
    grid.setAttribute('role', 'main');

    for (i = 0; i < fullConfig.cards.length; i++) {
      cardConfig = fullConfig.cards[i];

      if (!cardConfig || !cardConfig.type) {
        continue;
      }

      tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'ambient-home__tile ambient-home__tile--' + cardConfig.type;
      tile.setAttribute('data-card-id', cardConfig.id || cardConfig.type);
      tile.setAttribute('aria-label', cardConfig.title || cardConfig.type);

      instance = AmbientDisplay.cardRegistry.create(cardConfig.type);

      if (instance && typeof instance.renderTile === 'function') {
        instance.renderTile(tile, fullConfig, cardConfig);
        instances.push(instance);
      } else {
        tile.appendChild(document.createTextNode(cardConfig.title || cardConfig.type));
      }

      tile.addEventListener('click', handleTileClick(cardConfig), false);
      grid.appendChild(tile);
    }

    container.appendChild(grid);
  }

  function destroy() {
    var i;
    for (i = 0; i < instances.length; i++) {
      if (instances[i] && typeof instances[i].destroyTile === 'function') {
        instances[i].destroyTile();
      }
    }
    instances = [];
    if (grid && grid.parentNode) {
      grid.parentNode.removeChild(grid);
    }
    grid = null;
  }

  return {
    mount: mount,
    destroy: destroy
  };
}());
