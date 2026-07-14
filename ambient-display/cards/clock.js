/**
 * cards/clock.js — Clock Card
 */

/* global AmbientDisplay */
(function () {
  var TICK_MS = 1000;
  var utils = AmbientDisplay.cardUtils;

  function parseOptions(config) {
    var hourFormat = utils.option(config, 'hourFormat', '24');
    return {
      showSeconds: utils.option(config, 'showSeconds', true),
      showDate: utils.option(config, 'showDate', true),
      hourFormat: hourFormat === '12' ? '12' : '24',
      timezone: utils.option(config, 'timezone', null)
    };
  }

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

    formatted = utils.pad(hours) + ':' + utils.pad(minutes);
    if (showSeconds) {
      formatted += ':' + utils.pad(seconds);
    }
    return formatted + suffix;
  }

  function formatDateManual(date) {
    var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return days[date.getDay()] + ', ' + months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
  }

  function formatTime(date, opts) {
    var use24Hour = opts.hourFormat === '24';
    var intlOptions;
    var formatted;

    try {
      if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
        intlOptions = { hour: 'numeric', minute: '2-digit', hour12: !use24Hour };
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
    } catch (ignore) {}

    return formatTimeManual(date, use24Hour, opts.showSeconds);
  }

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
    } catch (ignore) {}

    return formatDateManual(date);
  }

  function createClockCard() {
    var config = null;
    var container = null;
    var root = null;
    var options = null;
    var timeElement = null;
    var dateElement = null;
    var intervalId = null;
    var textCache = { time: '', date: '' };
    var card = null;

    card = {
      init: function (cfg) {
        config = cfg || {};
        options = parseOptions(config);
      },

      render: function (cont) {
        container = cont;
        container.className += ' ambient-card-slot';
        root = utils.createCardRoot(container, 'clock-card');

        timeElement = document.createElement('div');
        timeElement.className = 'clock-card__time';
        root.appendChild(timeElement);

        if (options.showDate) {
          dateElement = document.createElement('div');
          dateElement.className = 'clock-card__date';
          root.appendChild(dateElement);
        }

        card.update();
        intervalId = window.setInterval(function () {
          card.update();
        }, TICK_MS);
      },

      update: function () {
        var now;
        var timeText;
        var dateText;

        if (!timeElement || !options) {
          return;
        }

        now = new Date();
        timeText = formatTime(now, options);
        textCache = utils.updateText(timeElement, textCache, 'time', timeText);

        if (dateElement && options.showDate) {
          dateText = formatDate(now, options);
          textCache = utils.updateText(dateElement, textCache, 'date', dateText);
        }
      },

      destroy: function () {
        intervalId = utils.clearTimer(intervalId);
        config = null;
        container = null;
        root = null;
        options = null;
        timeElement = null;
        dateElement = null;
        textCache = { time: '', date: '' };
      }
    };

    return card;
  }

  AmbientDisplay.cardRegistry.register('clock', createClockCard);
}());
