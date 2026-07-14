/**
 * shell.js — Permanent header: greeting, time, date (ES5)
 * Landscape layout: info left, clock right.
 */

/* global AmbientDisplay */
var AmbientDisplay = AmbientDisplay || {};

AmbientDisplay.shell = (function () {
  var root = null;
  var infoEl = null;
  var clockEl = null;
  var greetingEl = null;
  var timeEl = null;
  var weekdayEl = null;
  var dateEl = null;
  var config = null;
  var appConfig = null;
  var tickTimer = null;
  var lastPhase = null;

  function formatTimeParts(date, shellConfig) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var seconds = date.getSeconds();
    var use24 = shellConfig.hourFormat === '24';
    var suffix = '';
    var h = hours;

    if (!use24) {
      suffix = hours >= 12 ? 'PM' : 'AM';
      h = hours % 12;
      if (h === 0) {
        h = 12;
      }
    }

    return {
      hours: AmbientDisplay.providerUtils.pad(h),
      minutes: AmbientDisplay.providerUtils.pad(minutes),
      seconds: AmbientDisplay.providerUtils.pad(seconds),
      ampm: suffix,
      showSeconds: shellConfig.showSeconds !== false
    };
  }

  function renderTime(date, shellConfig) {
    var parts = formatTimeParts(date, shellConfig);
    var html = '';

    html += '<span class="ambient-shell__time-main">';
    html += parts.hours + ':' + parts.minutes;
    if (parts.showSeconds) {
      html += '<span class="ambient-shell__time-seconds">:' + parts.seconds + '</span>';
    }
    html += '</span>';

    if (parts.ampm) {
      html += '<span class="ambient-shell__time-ampm">' + parts.ampm + '</span>';
    }

    return html;
  }

  function formatWeekday(date) {
    try {
      return date.toLocaleDateString(undefined, { weekday: 'long' });
    } catch (e) {
      return date.toDateString().split(' ')[0];
    }
  }

  function formatFullDate(date) {
    try {
      return date.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      return date.toDateString();
    }
  }

  function updateGreeting(now) {
    var phase = AmbientDisplay.dayPhase.getCurrentPhase(now);
    var base = AmbientDisplay.providerUtils.greetingForPhase(phase);
    var emoji = AmbientDisplay.providerUtils.greetingEmoji(phase);
    var name = appConfig && appConfig.user ? appConfig.user.name : '';

    if (greetingEl) {
      greetingEl.textContent = base + ', ' + name + emoji;
      if (lastPhase !== phase) {
        greetingEl.className = 'ambient-shell__greeting ambient-shell__greeting--fade';
        lastPhase = phase;
      }
    }
  }

  function update() {
    var now = new Date();

    updateGreeting(now);

    if (timeEl && config) {
      timeEl.innerHTML = renderTime(now, config);
    }
    if (weekdayEl) {
      weekdayEl.textContent = formatWeekday(now);
    }
    if (dateEl) {
      dateEl.textContent = formatFullDate(now);
    }
  }

  function mount(container, fullConfig) {
    appConfig = fullConfig;
    config = fullConfig.shell || {};
    lastPhase = null;

    root = document.createElement('header');
    root.className = 'ambient-shell';
    root.setAttribute('role', 'banner');

    infoEl = document.createElement('div');
    infoEl.className = 'ambient-shell__info';

    clockEl = document.createElement('div');
    clockEl.className = 'ambient-shell__clock';

    greetingEl = document.createElement('p');
    greetingEl.className = 'ambient-shell__greeting';

    weekdayEl = document.createElement('p');
    weekdayEl.className = 'ambient-shell__weekday';

    dateEl = document.createElement('p');
    dateEl.className = 'ambient-shell__date';

    timeEl = document.createElement('p');
    timeEl.className = 'ambient-shell__time';

    infoEl.appendChild(greetingEl);
    infoEl.appendChild(weekdayEl);
    infoEl.appendChild(dateEl);
    clockEl.appendChild(timeEl);

    root.appendChild(infoEl);
    root.appendChild(clockEl);
    container.appendChild(root);

    update();
    tickTimer = window.setInterval(update, 1000);
  }

  function destroy() {
    if (tickTimer) {
      window.clearInterval(tickTimer);
      tickTimer = null;
    }
    if (root && root.parentNode) {
      root.parentNode.removeChild(root);
    }
    root = null;
    lastPhase = null;
  }

  return {
    mount: mount,
    destroy: destroy,
    update: update
  };
})();
