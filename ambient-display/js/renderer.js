/**
 * renderer.js — Display renderer for Ambient Display
 *
 * Reads the widget list from config and instantiates each entry through the
 * widget registry. Layout placement is delegated to the layout engine.
 * Exposes render() as the public paint API.
 */

/* global AmbientDisplay */
var AmbientDisplay = AmbientDisplay || {};

AmbientDisplay.renderer = (function () {
  var rootElement = null;
  var activeInstances = [];

  /**
   * Bind the renderer to the DOM mount point.
   */
  function init(element) {
    rootElement = element;
  }

  /**
   * Tear down previously mounted widgets to prevent timer / listener leaks.
   */
  function destroyAll() {
    var i;
    var instance;

    if (AmbientDisplay.assetManager && typeof AmbientDisplay.assetManager.releaseAll === 'function') {
      AmbientDisplay.assetManager.releaseAll();
    }

    for (i = 0; i < activeInstances.length; i++) {
      instance = activeInstances[i];

      if (instance && typeof instance.destroy === 'function') {
        instance.destroy();
      }
    }

    activeInstances = [];
  }

  /**
   * Create a generic widget container — the only DOM the renderer owns per widget.
   */
  function createWidgetContainer(widgetConfig) {
    var container = document.createElement('div');
    var type = widgetConfig.type || 'unknown';

    container.className = 'ambient-widget ambient-widget--' + type;
    container.setAttribute('data-widget-type', type);

    if (widgetConfig.id) {
      container.setAttribute('data-widget-id', widgetConfig.id);
    }

    return container;
  }

  /**
   * Render a placeholder when config references an unregistered widget type.
   */
  function renderUnknownWidget(container, type) {
    container.className += ' ambient-widget--unknown';
    container.appendChild(
      document.createTextNode('Unknown widget type: ' + type)
    );
  }

  /**
   * Instantiate a registered widget through the init → render lifecycle.
   */
  function instantiateWidget(factory, container, widgetConfig) {
    var instance = factory.create(container, widgetConfig);

    instance.init();
    instance.render();

    return instance;
  }

  /**
   * Build widget containers and let the layout engine position them.
   */
  function renderWidgets(widgets, layoutConfig) {
    var layoutContainer = AmbientDisplay.layoutEngine.createLayoutContainer(layoutConfig);
    var i;
    var widgetConfig;
    var type;
    var container;
    var factory;
    var instance;
    var preferredSize;

    for (i = 0; i < widgets.length; i++) {
      widgetConfig = widgets[i];
      type = widgetConfig && widgetConfig.type ? widgetConfig.type : null;

      if (!type) {
        continue;
      }

      container = createWidgetContainer(widgetConfig);
      factory = AmbientDisplay.widgetRegistry.get(type);

      preferredSize = factory && factory.preferredSize ? factory.preferredSize : null;
      AmbientDisplay.layoutEngine.applyWidgetSize(container, widgetConfig, preferredSize);

      if (factory) {
        instance = instantiateWidget(factory, container, widgetConfig);
        activeInstances.push(instance);
      } else {
        renderUnknownWidget(container, type);
      }

      layoutContainer.appendChild(container);
    }

    return layoutContainer;
  }

  /**
   * Render an error state when bootstrap fails.
   */
  function renderError(message) {
    if (!rootElement) {
      return;
    }

    destroyAll();
    rootElement.innerHTML = '';

    var errorBox = document.createElement('div');
    errorBox.className = 'ambient-error';
    errorBox.appendChild(document.createTextNode(message));

    rootElement.appendChild(errorBox);
  }

  /**
   * Paint the display from the active configuration.
   * This is the primary public API consumed by app.js.
   */
  function render(config) {
    var widgets;

    if (!rootElement) {
      return;
    }

    if (!config) {
      renderError('No configuration available.');
      return;
    }

    destroyAll();

    while (rootElement.firstChild) {
      rootElement.removeChild(rootElement.firstChild);
    }

    widgets = Object.prototype.toString.call(config.widgets) === '[object Array]'
      ? config.widgets
      : [];

    rootElement.appendChild(renderWidgets(widgets, config.layout));
  }

  return {
    init: init,
    render: render,
    renderError: renderError
  };
}());

/**
 * Public render() alias required by the platform contract.
 */
AmbientDisplay.render = AmbientDisplay.renderer.render;
