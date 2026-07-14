/**
 * cards/countdown.js — Event countdown Card
 */

/* global AmbientDisplay */
(function () {
  var utils = AmbientDisplay.cardUtils;
  var MINUTE_MS = 60000;

  function parseTargetDate(config) {
    var raw = utils.option(config, 'targetDate', null) || utils.option(config, 'eventDate', null);
    var parsed;

    if (!raw) {
      return null;
    }

    parsed = new Date(raw);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  function computeRemaining(target) {
    var diff = target.getTime() - Date.now();
    var totalMinutes;
    var days;
    var hours;
    var minutes;

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, done: true };
    }

    totalMinutes = Math.floor(diff / 60000);
    days = Math.floor(totalMinutes / 1440);
    hours = Math.floor((totalMinutes % 1440) / 60);
    minutes = totalMinutes % 60;

    return { days: days, hours: hours, minutes: minutes, done: false };
  }

  function createCountdownCard() {
    var config = null;
    var container = null;
    var root = null;
    var titleEl = null;
    var daysEl = null;
    var hoursEl = null;
    var minutesEl = null;
    var targetDate = null;
    var intervalId = null;
    var textCache = { title: '', days: '', hours: '', minutes: '', label: '' };
    var card = null;

    card = {
      init: function (cfg) {
        config = cfg || {};
        targetDate = parseTargetDate(config);
      },

      render: function (cont) {
        var grid;
        var unit;

        container = cont;
        container.className += ' ambient-card-slot';
        root = utils.createCardRoot(container, 'countdown-card');

        titleEl = document.createElement('div');
        titleEl.className = 'countdown-card__title';
        root.appendChild(titleEl);

        grid = document.createElement('div');
        grid.className = 'countdown-card__grid';
        root.appendChild(grid);

        daysEl = document.createElement('div');
        daysEl.className = 'countdown-card__unit';
        grid.appendChild(daysEl);

        hoursEl = document.createElement('div');
        hoursEl.className = 'countdown-card__unit';
        grid.appendChild(hoursEl);

        minutesEl = document.createElement('div');
        minutesEl.className = 'countdown-card__unit';
        grid.appendChild(minutesEl);

        card.update();
        intervalId = window.setInterval(function () {
          card.update();
        }, MINUTE_MS);
      },

      update: function () {
        var title = utils.option(config, 'title', 'Countdown');
        var remaining;
        var label;

        if (!targetDate) {
          textCache = utils.updateText(titleEl, textCache, 'title', title);
          textCache = utils.updateText(daysEl, textCache, 'days', 'Set targetDate in config');
          if (hoursEl) {
            hoursEl.innerHTML = '';
          }
          if (minutesEl) {
            minutesEl.innerHTML = '';
          }
          return;
        }

        remaining = computeRemaining(targetDate);
        label = remaining.done ? 'Event started!' : '';

        textCache = utils.updateText(titleEl, textCache, 'title', title);

        if (remaining.done) {
          daysEl.innerHTML = '<span class="countdown-card__value">0</span><span class="countdown-card__label">Days</span>';
          hoursEl.innerHTML = '<span class="countdown-card__value">0</span><span class="countdown-card__label">Hours</span>';
          minutesEl.innerHTML = '<span class="countdown-card__value">0</span><span class="countdown-card__label">Minutes</span>';
          textCache.label = label;
          return;
        }

        daysEl.innerHTML = '<span class="countdown-card__value">' + remaining.days + '</span><span class="countdown-card__label">Days</span>';
        hoursEl.innerHTML = '<span class="countdown-card__value">' + remaining.hours + '</span><span class="countdown-card__label">Hours</span>';
        minutesEl.innerHTML = '<span class="countdown-card__value">' + remaining.minutes + '</span><span class="countdown-card__label">Minutes</span>';
      },

      destroy: function () {
        intervalId = utils.clearTimer(intervalId);
        config = null;
        container = null;
        root = null;
        titleEl = null;
        daysEl = null;
        hoursEl = null;
        minutesEl = null;
        targetDate = null;
        textCache = { title: '', days: '', hours: '', minutes: '', label: '' };
      }
    };

    return card;
  }

  AmbientDisplay.cardRegistry.register('countdown', createCountdownCard);
}());
