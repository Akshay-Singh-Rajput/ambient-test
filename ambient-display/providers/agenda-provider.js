/**
 * providers/agenda-provider.js — Birthdays, appointments, deadlines, travel (ES5)
 */

/* global AmbientDisplay */
(function () {
  var u = AmbientDisplay.providerUtils;
  var REFRESH = 300000;

  function itemPriority(item, now) {
    var days = u.daysUntil(item.date, now);

    if (days < 0) {
      return 0;
    }
    if (days === 0) {
      return 100;
    }
    if (days === 1) {
      return 90;
    }
    if (days <= 7) {
      return 80;
    }
    if (days <= 14) {
      return 60;
    }
    return 0;
  }

  function buildPayload(item, now) {
    var days = u.daysUntil(item.date, now);
    var subtitle = '';
    var emphasis = 'normal';
    var type = item.type || 'reminder';

    if (days === 0) {
      subtitle = item.time ? 'Today \u00B7 ' + item.time : 'Today';
    } else if (days === 1) {
      subtitle = item.time ? 'Tomorrow \u00B7 ' + item.time : 'Tomorrow';
    } else {
      subtitle = 'In ' + days + ' days';
    }

    if (type === 'birthday' || type === 'anniversary') {
      emphasis = 'celebratory';
    }
    if (type === 'deadline' && days === 0) {
      emphasis = 'warning';
    }

    return {
      kind: type,
      title: item.title,
      subtitle: subtitle,
      time: item.time || null,
      emphasis: emphasis
    };
  }

  function build(config, now) {
    var items = config && config.agenda && config.agenda.items ? config.agenda.items : [];
    var best = null;
    var bestPriority = 0;
    var i;
    var p;

    for (i = 0; i < items.length; i++) {
      p = itemPriority(items[i], now);
      if (p > bestPriority) {
        bestPriority = p;
        best = items[i];
      }
    }

    if (!best || bestPriority === 0) {
      return u.emptyContent('agenda', REFRESH);
    }

    return u.makeContent({
      id: 'agenda',
      hasContent: true,
      priority: bestPriority,
      regionPreference: bestPriority >= 80 ? 'hero' : 'context',
      canBeHero: bestPriority >= 80,
      canRotate: false,
      refreshInterval: REFRESH,
      payload: buildPayload(best, now)
    });
  }

  AmbientDisplay.providerRegistry.register(
    AmbientDisplay.createProvider({ id: 'agenda', refreshMs: REFRESH, build: build })
  );
}());
