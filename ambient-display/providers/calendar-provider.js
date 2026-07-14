/**
 * providers/calendar-provider.js — Today's schedule only (ES5)
 */

/* global AmbientDisplay */
(function () {
  var u = AmbientDisplay.providerUtils;
  var REFRESH = 300000;

  function build(config, now) {
    var events = config && config.calendar && config.calendar.events ? config.calendar.events : [];
    var todayEvents = [];
    var i;
    var summary;

    for (i = 0; i < events.length; i++) {
      if (u.isSameDay(events[i].date, now)) {
        todayEvents.push(events[i]);
      }
    }

    if (!todayEvents.length) {
      return u.emptyContent('calendar', REFRESH);
    }

    todayEvents.sort(function (a, b) {
      var ta = a.time || '99:99';
      var tb = b.time || '99:99';
      return ta < tb ? -1 : ta > tb ? 1 : 0;
    });

    summary = todayEvents.length === 1
      ? todayEvents[0].title
      : todayEvents.length + ' events today';

    return u.makeContent({
      id: 'calendar',
      hasContent: true,
      priority: 65,
      regionPreference: 'context',
      canBeHero: false,
      canRotate: false,
      refreshInterval: REFRESH,
      payload: {
        summary: summary,
        next: todayEvents[0],
        total: todayEvents.length,
        events: todayEvents
      }
    });
  }

  AmbientDisplay.providerRegistry.register(
    AmbientDisplay.createProvider({ id: 'calendar', refreshMs: REFRESH, build: build })
  );
}());
