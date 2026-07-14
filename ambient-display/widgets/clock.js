/**
 * widgets/clock.js — Clock widget for Ambient Display
 *
 * Registers itself as type "clock". Exposes init(), render(), destroy().
 * All clock logic and DOM live here — the renderer only supplies the container.
 */

/* global AmbientDisplay */
(function () {
  var TICK_MS = 1000;

  /**
   * Resolve a display option with a safe default when config omits it.
   */
  function option(config, key, defaultValue) {
    var options = config && config.options ? config.options : {};
    return options.hasOwnProperty(key) ? options[key] : defaultValue;
  }

  /**
   * Normalize config into a validated options object with fallbacks.
   */
  function parseOptions(config) {
    var hourFormat = option(config, 'hourFormat', '24');

    return {
      showSeconds: option(config, 'showSeconds', true),
      showDate: option(config, 'showDate', true),
      hourFormat: hourFormat === '12' ? '12' : '24',
      timezone: option(config, 'timezone', null)
    };
  }

  /**
   * Pad a numeric component to two digits (ES5-safe).
   */
  function pad(value) {
    return value < 10 ? '0' + value : String(value);
  }

  /**
   * Manual local-time formatting — ultimate fallback when Intl is unavailable
   * or the configured timezone string is invalid.
   */
  function formatTimeManual(date, use24Hour, showSeconds) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var seconds = date.getSeconds();
    var suffix = '';
    var formatted;

    if (!use24Hour) {
      suffix = hours >= 12 ? ' PM' : ' AM';
      hours = hours % 12;

      if (hours === 0) {
        hours = 12;
      }
    }

    formatted = pad(hours) + ':' + pad(minutes);

    if (showSeconds) {
      formatted += ':' + pad(seconds);
    }

    return formatted + suffix;
  }

  /**
   * Manual local-date formatting — fallback when Intl is unavailable.
   */
  function formatDateManual(date) {
    var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return days[date.getDay()] + ', ' + months[date.getMonth()] + ' ' + date.getDate();
  }

  /**
   * Format time via Intl when possible so timezone and 12/24h are handled
   * correctly; falls back to manual local formatting on error.
   */
  function formatTime(date, opts) {
    var use24Hour = opts.hourFormat === '24';
    var intlOptions;
    var formatted;

    try {
      if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
        intlOptions = {
          hour: 'numeric',
          minute: '2-digit',
          hour12: !use24Hour
        };

        if (opts.showSeconds) {
          intlOptions.second = '2-digit';
        }

        if (opts.timezone) {
          intlOptions.timeZone = opts.timezone;
        }

        formatted = date.toLocaleTimeString(undefined, intlOptions);

        if (formatted) {
          return formatted;
        }
      }
    } catch (ignore) {
      /* Invalid timezone or Intl failure — use local manual formatting */
    }

    return formatTimeManual(date, use24Hour, opts.showSeconds);
  }

  /**
   * Format date via Intl when possible; falls back to manual local formatting.
   */
  function formatDate(date, opts) {
    var intlOptions;
    var formatted;

    try {
      if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
        intlOptions = {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        };

        if (opts.timezone) {
          intlOptions.timeZone = opts.timezone;
        }

        formatted = date.toLocaleDateString(undefined, intlOptions);

        if (formatted) {
          return formatted;
        }
      }
    } catch (ignore) {
      /* Invalid timezone or Intl failure — use local manual formatting */
    }

    return formatDateManual(date);
  }

  /**
   * Update text only when the value changed — avoids unnecessary DOM writes.
   */
  function updateText(element, cache, key, nextText) {
    if (!element) {
      return cache;
    }

    if (cache[key] !== nextText) {
      element.textContent = nextText;
      cache[key] = nextText;
    }

    return cache;
  }

  /**
   * Factory: build a clock widget instance bound to a renderer container.
   */
  function createClockWidget(container, config) {
    var widgetConfig = config;
    var options = null;
    var timeElement = null;
    var dateElement = null;
    var intervalId = null;
    var textCache = { time: '', date: '' };
    var widget = null;

    widget = {
      /**
       * One-time setup: parse config, build DOM skeleton, start tick interval.
       */
      init: function () {
        options = parseOptions(widgetConfig);

        /* Widget-owned class for scoped CSS — renderer keeps generic ambient-widget */
        container.className += ' clock-widget';

        timeElement = document.createElement('div');
        timeElement.className = 'clock-widget__time';
        timeElement.setAttribute('aria-hidden', 'true');
        container.appendChild(timeElement);

        if (options.showDate) {
          dateElement = document.createElement('div');
          dateElement.className = 'clock-widget__date';
          dateElement.setAttribute('aria-hidden', 'true');
          container.appendChild(dateElement);
        }

        /* Tick interval lives here until the platform scheduler replaces it */
        intervalId = window.setInterval(function () {
          widget.render();
        }, TICK_MS);
      },

      /**
       * Paint the current time and date from config-driven options.
       */
      render: function () {
        var now;
        var timeText;
        var dateText;

        if (!timeElement || !options) {
          return;
        }

        now = new Date();
        timeText = formatTime(now, options);
        textCache = updateText(timeElement, textCache, 'time', timeText);

        if (dateElement && options.showDate) {
          dateText = formatDate(now, options);
          textCache = updateText(dateElement, textCache, 'date', dateText);
        }
      },

      /**
       * Tear down timers and release references before the container is removed.
       */
      destroy: function () {
        if (intervalId !== null) {
          window.clearInterval(intervalId);
          intervalId = null;
        }

        timeElement = null;
        dateElement = null;
        options = null;
        textCache = { time: '', date: '' };
      }
    };

    return widget;
  }

  AmbientDisplay.widgetRegistry.register('clock', {
    create: createClockWidget,
    preferredSize: {
      width: 'auto',
      height: 'auto',
      grow: 0,
      shrink: 0,
      span: 1
    }
  });
}());
