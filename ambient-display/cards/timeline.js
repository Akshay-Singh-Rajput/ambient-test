/* global AmbientDisplay */
(function () {
  var u = AmbientDisplay.cardUtils;

  function iconLabel(icon) {
    var map = {
      fitness: 'Fitness',
      work: 'Work',
      social: 'Social',
      health: 'Health',
      flag: 'Flag',
      travel: 'Travel',
      calendar: 'Event'
    };
    return map[icon] || 'Event';
  }

  function createTimelineCard() {
    return {
      renderTile: function (container, appConfig, cardConfig) {
        var items = u.option(cardConfig, 'items', []);
        var sorted = u.sortTimelineItems(items);
        var next = sorted.length ? sorted[0] : null;

        container.appendChild(u.textEl('span', 'tile-card__label', cardConfig.title || 'Timeline'));
        if (next) {
          container.appendChild(u.textEl('span', 'tile-card__value', next.raw.title));
          container.appendChild(u.textEl('span', 'tile-card__meta', next.dateLabel + (next.raw.time ? ' \u00B7 ' + next.raw.time : '')));
        } else {
          container.appendChild(u.textEl('span', 'tile-card__meta', 'No upcoming events'));
        }
        container.appendChild(u.textEl('span', 'tile-card__sub', sorted.length + ' items'));
      },
      renderDetail: function (container, appConfig, cardConfig) {
        var items = u.sortTimelineItems(u.option(cardConfig, 'items', []));
        var i;
        var row;
        var list = document.createElement('div');
        list.className = 'detail-card__timeline';

        for (i = 0; i < items.length; i++) {
          row = document.createElement('div');
          row.className = 'detail-card__timeline-item';
          row.appendChild(u.textEl('span', 'detail-card__timeline-icon', iconLabel(items[i].raw.icon)));
          row.appendChild(u.textEl('span', 'detail-card__timeline-title', items[i].raw.title));
          row.appendChild(u.textEl('span', 'detail-card__timeline-meta', items[i].dateLabel + (items[i].raw.time ? ' \u00B7 ' + items[i].raw.time : '')));
          list.appendChild(row);
        }

        container.appendChild(list);
      },
      destroyTile: function () {},
      destroyDetail: function () {}
    };
  }

  AmbientDisplay.cardRegistry.register('timeline', createTimelineCard);
}());
