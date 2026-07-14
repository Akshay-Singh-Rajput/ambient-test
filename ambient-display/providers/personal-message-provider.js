/**
 * providers/personal-message-provider.js — Context-aware personal messages (ES5)
 */

/* global AmbientDisplay */
(function () {
  var u = AmbientDisplay.providerUtils;
  var REFRESH = 300000;

  var SCOPE_RANK = {
    birthday: 100,
    deadline: 90,
    appointment: 85,
    custom: 85,
    morning: 50,
    afternoon: 48,
    evening: 47,
    night: 46,
    daily: 40
  };

  function scopeMatches(message, phase, now) {
    var scope = message.scope || 'daily';

    if (scope === 'daily') {
      return true;
    }

    if (scope === 'morning' || scope === 'afternoon' || scope === 'evening' || scope === 'night') {
      return scope === phase;
    }

    if (scope === 'birthday' || scope === 'deadline' || scope === 'custom' || scope === 'appointment') {
      if (!message.date) {
        return false;
      }
      return u.isSameDay(message.date, now);
    }

    return false;
  }

  function selectMessage(messages, phase, now) {
    var best = null;
    var bestRank = 0;
    var i;
    var rank;

    for (i = 0; i < messages.length; i++) {
      if (!messages[i].text) {
        continue;
      }
      if (!scopeMatches(messages[i], phase, now)) {
        continue;
      }
      rank = SCOPE_RANK[messages[i].scope] || 30;
      if (rank > bestRank) {
        bestRank = rank;
        best = messages[i];
      }
    }

    return best ? { message: best, rank: bestRank } : null;
  }

  function build(config, now) {
    var messages = config && config.personalMessages ? config.personalMessages : [];
    var phase = AmbientDisplay.dayPhase.getCurrentPhase(now);
    var selected = selectMessage(messages, phase, now);
    var scope;
    var priority;
    var canBeHero = false;
    var regionPreference = 'ambient';

    if (!selected) {
      return u.emptyContent('personalMessage', REFRESH);
    }

    scope = selected.message.scope || 'daily';

    if (scope === 'birthday') {
      priority = 95;
      canBeHero = true;
      regionPreference = 'hero';
    } else if (scope === 'deadline') {
      priority = 94;
      canBeHero = true;
      regionPreference = 'hero';
    } else if (scope === 'custom' || scope === 'appointment') {
      priority = 93;
      canBeHero = true;
      regionPreference = 'hero';
    } else if (scope === 'morning' || scope === 'evening' || scope === 'night') {
      priority = 38;
    } else {
      priority = 32;
    }

    return u.makeContent({
      id: 'personalMessage',
      hasContent: true,
      priority: priority,
      regionPreference: regionPreference,
      canBeHero: canBeHero,
      canRotate: !canBeHero,
      refreshInterval: REFRESH,
      payload: {
        text: selected.message.text,
        scope: scope,
        emphasis: scope === 'birthday' ? 'celebratory' : scope === 'deadline' ? 'warning' : 'normal'
      }
    });
  }

  AmbientDisplay.providerRegistry.register(
    AmbientDisplay.createProvider({ id: 'personalMessage', refreshMs: REFRESH, build: build })
  );
}());
