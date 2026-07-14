/**
 * config-loader.js — Load and normalize config/config.json (ES5)
 */

/* global AmbientDisplay */
var AmbientDisplay = AmbientDisplay || {};

AmbientDisplay.configLoader = (function () {
  var CONFIG_PATH = 'config/config.json';
  var cached = null;

  function isArray(value) {
    return Object.prototype.toString.call(value) === '[object Array]';
  }

  function findCard(cards, type) {
    var i;
    for (i = 0; i < cards.length; i++) {
      if (cards[i].type === type) {
        return cards[i];
      }
    }
    return null;
  }

  function migrateFromCards(raw) {
    var cards = isArray(raw.cards) ? raw.cards : [];
    var weatherCard = findCard(cards, 'weather');
    var timelineCard = findCard(cards, 'timeline');
    var photoCard = findCard(cards, 'photo');
    var notesCard = findCard(cards, 'notes');
    var quoteCard = findCard(cards, 'quote');
    var timelineItems = timelineCard && timelineCard.options && timelineCard.options.items
      ? timelineCard.options.items
      : [];
    var agendaItems = [];
    var i;
    var item;

    for (i = 0; i < timelineItems.length; i++) {
      item = timelineItems[i];
      agendaItems.push({
        type: item.icon === 'flag' ? 'deadline' : item.icon === 'travel' ? 'travel' : 'appointment',
        title: item.title,
        date: item.date,
        time: item.time || null
      });
    }

    return {
      version: '3.1.0',
      user: raw.user || { name: 'Guest' },
      shell: raw.shell || {},
      settings: raw.settings || {},
      theme: raw.theme || { autoPhase: true },
      weather: weatherCard && weatherCard.options ? weatherCard.options : {},
      agenda: { items: agendaItems },
      photos: {
        album: 'Memories',
        items: photoCard && photoCard.options && photoCard.options.src
          ? [{ src: photoCard.options.src, caption: photoCard.options.caption || '' }]
          : []
      },
      quotes: quoteCard && quoteCard.options && quoteCard.options.quotes
        ? quoteCard.options.quotes
        : [],
      notes: notesCard && notesCard.options && notesCard.options.notes
        ? notesCard.options.notes
        : [],
      calendar: { events: [] },
      personalMessages: isArray(raw.personalMessages) ? raw.personalMessages : []
    };
  }

  function normalizeConfig(raw) {
    var config = raw || {};
    var hasV3 = config.weather || config.agenda || config.photos || config.quotes || config.notes || config.calendar;

    if (!hasV3 && isArray(config.cards) && config.cards.length) {
      config = migrateFromCards(config);
    }

    return {
      version: config.version || '3.1.0',
      user: {
        name: config.user && config.user.name ? String(config.user.name) : 'Guest'
      },
      shell: {
        hourFormat: config.shell && config.shell.hourFormat === '24' ? '24' : '12',
        showSeconds: config.shell ? config.shell.showSeconds !== false : true,
        timezone: config.shell && config.shell.timezone ? config.shell.timezone : null
      },
      settings: {
        ambientRotationMs: config.settings && config.settings.ambientRotationMs
          ? config.settings.ambientRotationMs
          : 45000,
        photoRotationMinutes: config.settings && config.settings.photoRotationMinutes
          ? config.settings.photoRotationMinutes
          : 30,
        contentRefreshMs: config.settings && config.settings.contentRefreshMs
          ? config.settings.contentRefreshMs
          : 60000
      },
      theme: {
        autoPhase: config.theme ? config.theme.autoPhase !== false : true
      },
      display: {
        target: config.display && config.display.target
          ? String(config.display.target)
          : 'ipad-mini-a1455',
        width: config.display && config.display.width ? config.display.width : 1024,
        height: config.display && config.display.height ? config.display.height : 768,
        orientation: config.display && config.display.orientation
          ? String(config.display.orientation)
          : 'landscape'
      },
      weather: config.weather || {},
      agenda: {
        items: config.agenda && isArray(config.agenda.items) ? config.agenda.items : []
      },
      photos: {
        album: config.photos && config.photos.album ? config.photos.album : 'Memories',
        rotationMinutes: config.photos && config.photos.rotationMinutes
          ? config.photos.rotationMinutes
          : null,
        items: config.photos && isArray(config.photos.items) ? config.photos.items : []
      },
      quotes: isArray(config.quotes) ? config.quotes : [],
      notes: isArray(config.notes) ? config.notes : [],
      calendar: {
        events: config.calendar && isArray(config.calendar.events) ? config.calendar.events : []
      },
      personalMessages: isArray(config.personalMessages) ? config.personalMessages : []
    };
  }

  function load(callback) {
    if (cached) {
      callback(null, cached);
      return;
    }

    var xhr = new XMLHttpRequest();
    xhr.open('GET', CONFIG_PATH, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) {
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          cached = normalizeConfig(JSON.parse(xhr.responseText));
          callback(null, cached);
        } catch (e) {
          callback(e, null);
        }
        return;
      }

      callback(new Error('Unable to load config (HTTP ' + xhr.status + ')'), null);
    };
    xhr.onerror = function () {
      callback(new Error('Network error while loading config'), null);
    };
    xhr.send(null);
  }

  function setConfig(config) {
    cached = normalizeConfig(config);
  }

  function getConfig() {
    return cached;
  }

  return {
    load: load,
    setConfig: setConfig,
    getConfig: getConfig,
    normalizeConfig: normalizeConfig
  };
}());
