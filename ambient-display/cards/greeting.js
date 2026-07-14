/**
 * cards/greeting.js — Time-based greeting Card
 */

/* global AmbientDisplay */
(function () {
  var utils = AmbientDisplay.cardUtils;
  var HOUR_MS = 3600000;

  function greetingForHour(hour) {
    if (hour >= 5 && hour < 12) {
      return 'Good Morning';
    }
    if (hour >= 12 && hour < 17) {
      return 'Good Afternoon';
    }
    if (hour >= 17 && hour < 21) {
      return 'Good Evening';
    }
    return 'Good Night';
  }

  function createGreetingCard() {
    var config = null;
    var container = null;
    var root = null;
    var greetingEl = null;
    var nameEl = null;
    var intervalId = null;
    var textCache = { greeting: '', name: '' };
    var card = null;

    card = {
      init: function (cfg) {
        config = cfg || {};
      },

      render: function (cont) {
        container = cont;
        container.className += ' ambient-card-slot';
        root = utils.createCardRoot(container, 'greeting-card');

        greetingEl = document.createElement('div');
        greetingEl.className = 'greeting-card__text';
        root.appendChild(greetingEl);

        nameEl = document.createElement('div');
        nameEl.className = 'greeting-card__name';
        root.appendChild(nameEl);

        card.update();
        intervalId = window.setInterval(function () {
          card.update();
        }, HOUR_MS);
      },

      update: function () {
        var name = utils.option(config, 'name', '');
        var greeting = greetingForHour(new Date().getHours());
        var nameText = name ? name : '';

        textCache = utils.updateText(greetingEl, textCache, 'greeting', greeting);
        textCache = utils.updateText(nameEl, textCache, 'name', nameText);

        if (nameEl) {
          nameEl.style.display = nameText ? 'block' : 'none';
        }
      },

      destroy: function () {
        intervalId = utils.clearTimer(intervalId);
        config = null;
        container = null;
        root = null;
        greetingEl = null;
        nameEl = null;
        textCache = { greeting: '', name: '' };
      }
    };

    return card;
  }

  AmbientDisplay.cardRegistry.register('greeting', createGreetingCard);
}());
