/**
 * shell.js — Permanent header / night clock layout (ES5)
 */

/* global AmbientDisplay */
var AmbientDisplay = AmbientDisplay || {};

AmbientDisplay.shell = (function () {
  var root = null;
  var greetingEl = null;
  var timeEl = null;
  var weekdayEl = null;
  var dateEl = null;
  var nightMessageEl = null;
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
    var showSeconds = shellConfig.showSeconds !== false;

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
      showSeconds: showSeconds
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
    var fullConfig = AmbientDisplay.configLoader ? AmbientDisplay.configLoader.getConfig() : null;
    var phase = AmbientDisplay.dayPhase.getCurrentPhase(now, fullConfig);
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

  function applyLayout(screen) {
    var modeId = screen.displayMode || 'standard';
    var flags = screen.flags || {};
    var isPrepare = modeId === 'prepare';
    var isBedside = modeId === 'bedside';
    var shellClass = 'ambient-shell';

    if (!root) {
      return;
    }

    if (isPrepare) {
      shellClass += ' ambient-shell--prepare';
    } else if (isBedside) {
      shellClass += ' ambient-shell--bedside';
    }

    root.className = shellClass;

    if (greetingEl) {
      greetingEl.style.display = flags.showGreeting === false ? 'none' : '';
    }
    if (weekdayEl) {
      weekdayEl.style.display = flags.showWeekday === false ? 'none' : '';
    }
    if (dateEl) {
      dateEl.style.display = flags.showDate === false ? 'none' : '';
    }
    if (nightMessageEl) {
      if (isPrepare && screen.prepareMessage && flags.showPersonalMessage !== false) {
        nightMessageEl.textContent = screen.prepareMessage;
        nightMessageEl.style.display = 'block';
      } else {
        nightMessageEl.style.display = 'none';
      }
    }
  }

  function mount(container, fullConfig) {
    appConfig = fullConfig;
    config = fullConfig.shell || {};
    lastPhase = null;

    root = document.createElement('header');
    root.className = 'ambient-shell';
    root.setAttribute('role', 'banner');

    greetingEl = document.createElement('p');
    greetingEl.className = 'ambient-shell__greeting';

    timeEl = document.createElement('p');
    timeEl.className = 'ambient-shell__time';

    weekdayEl = document.createElement('p');
    weekdayEl.className = 'ambient-shell__weekday';

    dateEl = document.createElement('p');
    dateEl.className = 'ambient-shell__date';

    nightMessageEl = document.createElement('p');
    nightMessageEl.className = 'ambient-shell__night-message';
    nightMessageEl.style.display = 'none';

    root.appendChild(greetingEl);
    root.appendChild(timeEl);
    root.appendChild(weekdayEl);
    root.appendChild(dateEl);
    root.appendChild(nightMessageEl);
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
    update: update,
    applyLayout: applyLayout
  };
})();
