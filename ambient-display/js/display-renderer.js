/**
 * display-renderer.js — Render curated regions (ES5, read-only)
 */

/* global AmbientDisplay */
var AmbientDisplay = AmbientDisplay || {};

AmbientDisplay.displayRenderer = (function () {
  var stageEl = null;
  var heroEl = null;
  var contextEl = null;
  var ambientEl = null;
  var ambientItems = [];
  var ambientIndex = 0;
  var ambientTimer = null;
  var ambientInterval = 45000;
  var lastHeroKey = '';
  var lastContextKey = '';
  var lastPhotoSrc = '';

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function itemKey(item) {
    if (!item || !item.payload) {
      return '';
    }
    return item.id + ':' + JSON.stringify(item.payload);
  }

  function renderAgenda(payload, isHero) {
    var html = '';
    var kindLabel = payload.kind ? payload.kind.charAt(0).toUpperCase() + payload.kind.slice(1) : 'Event';

    html += '<div class="ambient-block ambient-block--agenda' + (isHero ? ' ambient-block--hero' : '') + '">';
    if (isHero) {
      html += '<p class="ambient-block__eyebrow">' + escapeHtml(kindLabel) + '</p>';
    }
    html += '<h2 class="ambient-block__title">' + escapeHtml(payload.title) + '</h2>';
    if (payload.subtitle) {
      html += '<p class="ambient-block__subtitle">' + escapeHtml(payload.subtitle) + '</p>';
    }
    html += '</div>';
    return html;
  }

  function renderWeather(payload) {
    var html = '';

    html += '<div class="ambient-block ambient-block--weather ambient-animate-instant">';
    html += '<p class="ambient-block__eyebrow">' + escapeHtml(payload.location) + '</p>';
    html += '<p class="ambient-block__metric">' + escapeHtml(String(payload.temperature)) + '&deg;' + escapeHtml(payload.unit) + '</p>';
    html += '<p class="ambient-block__subtitle">' + escapeHtml(payload.condition) + '</p>';
    if (payload.rainAlert) {
      html += '<p class="ambient-block__alert">Rain expected</p>';
    }
    html += '</div>';
    return html;
  }

  function renderCalendar(payload) {
    var html = '';
    var next = payload.next;

    html += '<div class="ambient-block ambient-block--calendar">';
    html += '<p class="ambient-block__eyebrow">Today</p>';
    html += '<h3 class="ambient-block__title ambient-block__title--sm">' + escapeHtml(payload.summary) + '</h3>';
    if (next && next.time) {
      html += '<p class="ambient-block__subtitle">Next at ' + escapeHtml(next.time) + '</p>';
    }
    html += '</div>';
    return html;
  }

  function renderPhotoHtml(payload, isHero) {
    var html = '';

    html += '<div class="ambient-block ambient-block--photo' + (isHero ? ' ambient-block--hero-photo' : '') + '">';
    html += '<div class="ambient-photo__frame">';
    html += '<img class="ambient-photo__img ambient-photo__img--active" src="' + escapeHtml(payload.src) + '" alt="">';
    html += '</div>';
    if (payload.caption) {
      html += '<p class="ambient-photo__caption">' + escapeHtml(payload.caption) + '</p>';
    }
    if (isHero && payload.album) {
      html += '<p class="ambient-photo__album">' + escapeHtml(payload.album) + '</p>';
    }
    html += '</div>';
    return html;
  }

  function crossfadePhoto(container, payload, isHero) {
    var frame = container.querySelector('.ambient-photo__frame');
    var current;
    var next;

    if (!frame) {
      container.innerHTML = renderPhotoHtml(payload, isHero);
      lastPhotoSrc = payload.src;
      return;
    }

    if (payload.src === lastPhotoSrc) {
      return;
    }

    current = frame.querySelector('.ambient-photo__img--active');
    next = document.createElement('img');
    next.className = 'ambient-photo__img ambient-photo__img--incoming';
    next.setAttribute('src', payload.src);
    next.setAttribute('alt', '');

    frame.appendChild(next);

    window.setTimeout(function () {
      if (current && current.parentNode) {
        current.parentNode.removeChild(current);
      }
      next.className = 'ambient-photo__img ambient-photo__img--active';
      lastPhotoSrc = payload.src;
    }, 1200);
  }

  function renderPhoto(payload, isHero) {
    return renderPhotoHtml(payload, isHero);
  }

  function renderQuote(payload) {
    var html = '';

    html += '<div class="ambient-block ambient-block--quote ambient-animate-fade">';
    html += '<p class="ambient-quote__text">&ldquo;' + escapeHtml(payload.text) + '&rdquo;</p>';
    if (payload.author) {
      html += '<p class="ambient-quote__author">&mdash; ' + escapeHtml(payload.author) + '</p>';
    }
    html += '</div>';
    return html;
  }

  function renderNotes(payload) {
    var html = '';

    html += '<div class="ambient-block ambient-block--note ambient-animate-fade">';
    html += '<p class="ambient-block__eyebrow">Note</p>';
    html += '<p class="ambient-note__text">' + escapeHtml(payload.text) + '</p>';
    html += '</div>';
    return html;
  }

  function renderPersonalMessage(payload, isHero) {
    var html = '';

    html += '<div class="ambient-block ambient-block--message' + (isHero ? ' ambient-block--hero-message' : '') + ' ambient-animate-fade">';
    html += '<p class="ambient-message__text">' + escapeHtml(payload.text) + '</p>';
    html += '</div>';
    return html;
  }

  function renderItem(item, isHero) {
    if (!item || !item.payload) {
      return '';
    }

    switch (item.id) {
      case 'agenda':
        return renderAgenda(item.payload, isHero);
      case 'weather':
        return renderWeather(item.payload);
      case 'calendar':
        return renderCalendar(item.payload);
      case 'photo':
        return renderPhoto(item.payload, isHero);
      case 'quote':
        return renderQuote(item.payload);
      case 'notes':
        return renderNotes(item.payload);
      case 'personalMessage':
        return renderPersonalMessage(item.payload, isHero);
      default:
        return '';
    }
  }

  function applyMode(mode) {
    var root = document.querySelector('.ambient-app');
    if (!root) {
      return;
    }
    root.className = 'ambient-app ambient-mode-' + (mode || 'normal');
  }

  function renderHero(hero) {
    var key;
    var temp;

    if (!heroEl) {
      return;
    }

    key = itemKey(hero);
    if (key === lastHeroKey) {
      return;
    }
    lastHeroKey = key;

    if (!hero) {
      heroEl.innerHTML = '';
      heroEl.className = 'ambient-hero';
      return;
    }

    if (hero.id === 'photo') {
      if (!heroEl.querySelector('.ambient-block--photo')) {
        heroEl.innerHTML = renderPhoto(hero.payload, true);
        lastPhotoSrc = hero.payload.src;
      } else {
        crossfadePhoto(heroEl, hero.payload, true);
      }
    } else {
      temp = document.createElement('div');
      temp.innerHTML = renderItem(hero, true);
      heroEl.innerHTML = '';
      heroEl.appendChild(temp.firstChild);
    }

    heroEl.className = 'ambient-hero ambient-hero--filled ambient-animate-fade';
  }

  function renderContext(context) {
    var key = '';
    var html = '';
    var i;

    if (!contextEl) {
      return;
    }

    for (i = 0; i < context.length; i++) {
      key += itemKey(context[i]) + '|';
    }

    if (key === lastContextKey) {
      return;
    }
    lastContextKey = key;

    for (i = 0; i < context.length; i++) {
      html += renderItem(context[i], false);
    }

    contextEl.innerHTML = html;
    contextEl.className = 'ambient-context' + (context.length ? ' ambient-context--filled' : '');
  }

  function renderAmbientSlot() {
    var item;
    var temp;

    if (!ambientEl || !ambientItems.length) {
      if (ambientEl) {
        ambientEl.innerHTML = '';
        ambientEl.className = 'ambient-ambient';
      }
      return;
    }

    item = ambientItems[ambientIndex % ambientItems.length];

    if (item.id === 'photo') {
      if (!ambientEl.querySelector('.ambient-block--photo')) {
        ambientEl.innerHTML = renderPhoto(item.payload, false);
        lastPhotoSrc = item.payload.src;
      } else {
        crossfadePhoto(ambientEl, item.payload, false);
      }
    } else {
      temp = document.createElement('div');
      temp.innerHTML = renderItem(item, false);
      ambientEl.innerHTML = '';
      ambientEl.appendChild(temp.firstChild);
    }

    ambientEl.className = 'ambient-ambient ambient-ambient--filled';
  }

  function startAmbientRotation(items) {
    ambientItems = items || [];
    ambientIndex = 0;

    if (ambientTimer) {
      window.clearInterval(ambientTimer);
      ambientTimer = null;
    }

    renderAmbientSlot();

    if (ambientItems.length > 1) {
      ambientTimer = window.setInterval(function () {
        ambientIndex += 1;
        renderAmbientSlot();
      }, ambientInterval);
    }
  }

  function mount(container, settings) {
    if (settings && settings.ambientRotationMs) {
      ambientInterval = settings.ambientRotationMs;
    }

    stageEl = document.createElement('main');
    stageEl.className = 'ambient-stage';
    stageEl.setAttribute('role', 'main');

    heroEl = document.createElement('section');
    heroEl.className = 'ambient-hero';
    heroEl.setAttribute('aria-label', 'Primary focus');

    contextEl = document.createElement('section');
    contextEl.className = 'ambient-context';
    contextEl.setAttribute('aria-label', 'Supporting information');

    ambientEl = document.createElement('section');
    ambientEl.className = 'ambient-ambient';
    ambientEl.setAttribute('aria-label', 'Ambient content');

    stageEl.appendChild(heroEl);
    stageEl.appendChild(contextEl);
    stageEl.appendChild(ambientEl);
    container.appendChild(stageEl);
  }

  function render(screen) {
    applyMode(screen.mode || 'normal');
    renderHero(screen.hero);
    renderContext(screen.context || []);
    startAmbientRotation(screen.ambient || []);
  }

  function destroy() {
    if (ambientTimer) {
      window.clearInterval(ambientTimer);
      ambientTimer = null;
    }
    if (stageEl && stageEl.parentNode) {
      stageEl.parentNode.removeChild(stageEl);
    }
    stageEl = null;
    heroEl = null;
    contextEl = null;
    ambientEl = null;
    ambientItems = [];
    lastHeroKey = '';
    lastContextKey = '';
    lastPhotoSrc = '';
  }

  return {
    mount: mount,
    render: render,
    destroy: destroy
  };
})();
