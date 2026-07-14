/**
 * theme-engine.js — Theme engine for Ambient Display
 *
 * Reads theme.name from config.json and applies the matching CSS class to
 * the document root. All visual tokens live in css/themes.css — this module
 * only toggles classes; it never writes inline styles or modifies widget HTML.
 */

/* global AmbientDisplay */
var AmbientDisplay = AmbientDisplay || {};

AmbientDisplay.themeEngine = (function () {
  var SUPPORTED_THEMES = ['light', 'dark', 'midnight', 'minimal'];
  var DEFAULT_THEME = 'dark';
  var CLASS_PREFIX = 'theme-';
  var activeTheme = DEFAULT_THEME;

  /**
   * Strip a single class name from an element (ES5 fallback for classList.remove).
   */
  function removeClass(element, className) {
    var pattern = new RegExp('(^|\\s)' + className + '(\\s|$)', 'g');
    element.className = element.className.replace(pattern, ' ').replace(/\s+/g, ' ');

    if (element.className.charAt(0) === ' ') {
      element.className = element.className.substring(1);
    }

    if (element.className.charAt(element.className.length - 1) === ' ') {
      element.className = element.className.substring(0, element.className.length - 1);
    }
  }

  /**
   * Remove every theme class from the root element before applying a new one.
   */
  function clearThemeClasses(element) {
    var i;
    var themeClass;

    for (i = 0; i < SUPPORTED_THEMES.length; i++) {
      themeClass = CLASS_PREFIX + SUPPORTED_THEMES[i];

      if (element.classList) {
        element.classList.remove(themeClass);
      } else {
        removeClass(element, themeClass);
      }
    }
  }

  /**
   * Validate theme name from config; unknown values fall back to default.
   */
  function resolveThemeName(themeConfig) {
    var requested = themeConfig && themeConfig.name ? String(themeConfig.name).toLowerCase() : '';
    var i;

    for (i = 0; i < SUPPORTED_THEMES.length; i++) {
      if (SUPPORTED_THEMES[i] === requested) {
        return requested;
      }
    }

    return DEFAULT_THEME;
  }

  /**
   * Apply the theme defined in config.theme by setting a root CSS class.
   * Returns the resolved theme name that was applied.
   */
  function apply(themeConfig) {
    var html = document.documentElement;
    var themeName = resolveThemeName(themeConfig);
    var themeClass = CLASS_PREFIX + themeName;

    clearThemeClasses(html);

    if (html.classList) {
      html.classList.add(themeClass);
    } else {
      html.className = (html.className + ' ' + themeClass).replace(/\s+/g, ' ');
    }

    activeTheme = themeName;
    return themeName;
  }

  /**
   * Return the currently active theme name.
   */
  function getActive() {
    return activeTheme;
  }

  /**
   * Return the list of supported theme identifiers.
   */
  function getSupported() {
    return SUPPORTED_THEMES.slice();
  }

  return {
    apply: apply,
    getActive: getActive,
    getSupported: getSupported
  };
}());
