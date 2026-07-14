/* global AmbientDisplay */
(function () {
  var u = AmbientDisplay.cardUtils;

  function createWeatherCard() {
    return {
      renderTile: function (container, appConfig, cardConfig) {
        var temp = u.option(cardConfig, 'temperature', '--');
        var unit = u.option(cardConfig, 'unit', 'C');
        var condition = u.option(cardConfig, 'condition', '');
        var location = u.option(cardConfig, 'location', '');

        container.appendChild(u.textEl('span', 'tile-card__label', cardConfig.title || 'Weather'));
        container.appendChild(u.textEl('span', 'tile-card__value tile-card__value--lg', temp + '\u00B0' + unit));
        container.appendChild(u.textEl('span', 'tile-card__meta', condition));
        container.appendChild(u.textEl('span', 'tile-card__sub', location));
      },
      renderDetail: function (container, appConfig, cardConfig) {
        var temp = u.option(cardConfig, 'temperature', '--');
        var unit = u.option(cardConfig, 'unit', 'C');
        var condition = u.option(cardConfig, 'condition', '');
        var location = u.option(cardConfig, 'location', '');
        var high = u.option(cardConfig, 'high', '');
        var low = u.option(cardConfig, 'low', '');
        var humidity = u.option(cardConfig, 'humidity', '');
        var forecast = u.option(cardConfig, 'forecast', []);
        var i;

        container.appendChild(u.textEl('p', 'detail-card__location', location));
        container.appendChild(u.textEl('p', 'detail-card__hero', temp + '\u00B0' + unit));
        container.appendChild(u.textEl('p', 'detail-card__subtitle', condition));

        var stats = document.createElement('div');
        stats.className = 'detail-card__stats';
        stats.appendChild(u.textEl('span', 'detail-card__stat', 'H ' + high + '\u00B0'));
        stats.appendChild(u.textEl('span', 'detail-card__stat', 'L ' + low + '\u00B0'));
        stats.appendChild(u.textEl('span', 'detail-card__stat', humidity + '% humidity'));
        container.appendChild(stats);

        var list = document.createElement('div');
        list.className = 'detail-card__list';
        for (i = 0; i < forecast.length; i++) {
          var row = document.createElement('div');
          row.className = 'detail-card__row';
          row.appendChild(u.textEl('span', 'detail-card__row-title', forecast[i].day));
          row.appendChild(u.textEl('span', 'detail-card__row-meta', forecast[i].condition));
          row.appendChild(u.textEl('span', 'detail-card__row-value', forecast[i].high + '\u00B0 / ' + forecast[i].low + '\u00B0'));
          list.appendChild(row);
        }
        container.appendChild(list);
      },
      destroyTile: function () {},
      destroyDetail: function () {}
    };
  }

  AmbientDisplay.cardRegistry.register('weather', createWeatherCard);
}());
