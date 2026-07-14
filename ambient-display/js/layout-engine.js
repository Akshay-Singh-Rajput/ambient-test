/**
 * layout-engine.js — Layout engine for Ambient Display
 *
 * Reads layout settings from config.json and applies CSS classes / variables
 * to position card slots. Completely independent of card internals —
 * it only understands container elements and size declarations.
 */

/* global AmbientDisplay */
var AmbientDisplay = AmbientDisplay || {};

AmbientDisplay.layoutEngine = (function () {
  var SUPPORTED_LAYOUTS = ['center', 'stack', 'grid', 'fullscreen', 'top-bottom', 'dashboard', 'minimal'];
  var SUPPORTED_WIDTHS = ['auto', 'full', 'half', 'third', 'quarter'];
  var SUPPORTED_HEIGHTS = ['auto', 'full', 'half'];
  var DEFAULT_LAYOUT = {
    type: 'center',
    gap: '2rem',
    padding: '2rem',
    columns: 2
  };
  var DEFAULT_SIZE = {
    width: 'auto',
    height: 'auto',
    grow: 0,
    shrink: 1,
    span: 1
  };

  /**
   * Resolve layout type; unknown values fall back to center.
   */
  function resolveLayoutType(type) {
    var requested = typeof type === 'string' ? type.toLowerCase() : '';
    var i;

    for (i = 0; i < SUPPORTED_LAYOUTS.length; i++) {
      if (SUPPORTED_LAYOUTS[i] === requested) {
        return requested;
      }
    }

    return DEFAULT_LAYOUT.type;
  }

  /**
   * Resolve a size token against allowed values.
   */
  function resolveSizeToken(value, allowed, fallback) {
    var requested = typeof value === 'string' ? value.toLowerCase() : '';
    var i;

    for (i = 0; i < allowed.length; i++) {
      if (allowed[i] === requested) {
        return requested;
      }
    }

    return fallback;
  }

  /**
   * Normalize layout config from config.json.
   */
  function normalizeLayout(layoutConfig) {
    var layout = layoutConfig || {};
    var columns = parseInt(layout.columns, 10);

    if (isNaN(columns) || columns < 1) {
      columns = DEFAULT_LAYOUT.columns;
    }

    if (columns > 4) {
      columns = 4;
    }

    return {
      type: resolveLayoutType(layout.type),
      gap: typeof layout.gap === 'string' ? layout.gap : DEFAULT_LAYOUT.gap,
      padding: typeof layout.padding === 'string' ? layout.padding : DEFAULT_LAYOUT.padding,
      columns: columns
    };
  }

  /**
   * Normalize card size, merging config overrides with card defaults.
   */
  function normalizeSize(sizeConfig, preferredSize) {
    var size = sizeConfig || {};
    var preferred = preferredSize || {};
    var span = parseInt(size.span !== undefined ? size.span : preferred.span, 10);
    var grow = size.grow !== undefined ? size.grow : preferred.grow;
    var shrink = size.shrink !== undefined ? size.shrink : preferred.shrink;

    if (isNaN(span) || span < 1) {
      span = DEFAULT_SIZE.span;
    }

    if (span > 4) {
      span = 4;
    }

    return {
      width: resolveSizeToken(
        size.width !== undefined ? size.width : preferred.width,
        SUPPORTED_WIDTHS,
        DEFAULT_SIZE.width
      ),
      height: resolveSizeToken(
        size.height !== undefined ? size.height : preferred.height,
        SUPPORTED_HEIGHTS,
        DEFAULT_SIZE.height
      ),
      grow: typeof grow === 'number' && !isNaN(grow) ? grow : DEFAULT_SIZE.grow,
      shrink: typeof shrink === 'number' && !isNaN(shrink) ? shrink : DEFAULT_SIZE.shrink,
      span: span
    };
  }

  /**
   * Set config-driven CSS variables on a layout container.
   */
  function applyLayoutVariables(container, layout) {
    container.style.padding = layout.padding;

    if (container.style.setProperty) {
      container.style.setProperty('--layout-gap', layout.gap);
      container.style.setProperty('--layout-padding', layout.padding);
      container.style.setProperty('--layout-columns', String(layout.columns));
    }
  }

  /**
   * Build the layout shell that holds card slots.
   */
  function createLayoutContainer(layoutConfig) {
    var layout = normalizeLayout(layoutConfig);
    var container = document.createElement('div');

    container.className = 'ambient-layout ambient-layout--' + layout.type;
    container.setAttribute('data-layout', layout.type);
    container.setAttribute('data-columns', String(layout.columns));
    applyLayoutVariables(container, layout);

    return container;
  }

  /**
   * Apply preferred-size classes and flex/grid attributes to a card slot.
   */
  function applyCardSize(container, cardConfig, preferredSize) {
    var size = normalizeSize(cardConfig.size, preferredSize);

    container.className += ' ambient-card-size--w-' + size.width;
    container.className += ' ambient-card-size--h-' + size.height;

    if (size.span > 1) {
      container.className += ' ambient-card-size--span-' + size.span;
      container.setAttribute('data-span', String(size.span));
    }

    container.style.webkitBoxFlex = String(size.grow);
    container.style.webkitFlexGrow = String(size.grow);
    container.style.flexGrow = String(size.grow);
    container.style.webkitFlexShrink = String(size.shrink);
    container.style.flexShrink = String(size.shrink);
  }

  /**
   * Map card types to dashboard grid areas (landscape-first layout).
   */
  var DASHBOARD_AREAS = {
    clock: 'clock',
    greeting: 'greeting',
    photo: 'photo',
    countdown: 'countdown',
    quote: 'quote',
    status: 'status'
  };

  function applyDashboardArea(container, type, cardConfig) {
    var area = cardConfig && cardConfig.area ? cardConfig.area : DASHBOARD_AREAS[type];

    if (area) {
      container.setAttribute('data-dashboard-area', area);
    }
  }

  return {
    normalizeLayout: normalizeLayout,
    normalizeSize: normalizeSize,
    createLayoutContainer: createLayoutContainer,
    applyCardSize: applyCardSize,
    applyDashboardArea: applyDashboardArea,
    getSupportedLayouts: function () {
      return SUPPORTED_LAYOUTS.slice();
    }
  };
}());
