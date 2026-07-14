/**
 * cards/status.js — Status information Card
 */

/* global AmbientDisplay */
(function () {
  var utils = AmbientDisplay.cardUtils;
  var STATUS_MS = 30000;

  function formatSyncTime(timestamp) {
    var date;

    if (!timestamp) {
      return 'Never';
    }

    date = new Date(timestamp);

    if (isNaN(date.getTime())) {
      return 'Unknown';
    }

    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  function createStatusCard() {
    var config = null;
    var container = null;
    var root = null;
    var rows = {};
    var intervalId = null;
    var textCache = {};
    var card = null;

    function ensureRow(key, label) {
      var row;
      var labelEl;
      var valueEl;

      if (rows[key]) {
        return rows[key].value;
      }

      row = document.createElement('div');
      row.className = 'status-card__row';

      labelEl = document.createElement('span');
      labelEl.className = 'status-card__label';
      labelEl.textContent = label;
      row.appendChild(labelEl);

      valueEl = document.createElement('span');
      valueEl.className = 'status-card__value';
      row.appendChild(valueEl);

      root.appendChild(row);
      rows[key] = { row: row, value: valueEl };
      return valueEl;
    }

    card = {
      init: function (cfg) {
        config = cfg || {};
      },

      render: function (cont) {
        container = cont;
        container.className += ' ambient-card-slot';
        root = utils.createCardRoot(container, 'status-card');

        ensureRow('online', 'Network');
        ensureRow('battery', 'Battery');
        ensureRow('sync', 'Last Sync');
        ensureRow('version', 'Version');
        ensureRow('custom', 'Info');

        card.update();
        intervalId = window.setInterval(function () {
          card.update();
        }, STATUS_MS);

        if (window.addEventListener) {
          window.addEventListener('online', card.update, false);
          window.addEventListener('offline', card.update, false);
        }
      },

      update: function () {
        var showBattery = utils.option(config, 'showBattery', true) !== false;
        var showOnline = utils.option(config, 'showOnline', true) !== false;
        var showSync = utils.option(config, 'showSync', true) !== false;
        var showVersion = utils.option(config, 'showVersion', true) !== false;
        var customText = utils.option(config, 'customText', '');
        var version = utils.option(config, 'appVersion', null);
        var syncTs = utils.option(config, 'lastSync', null);
        var batteryText = 'N/A';

        if (showOnline && rows.online) {
          textCache = utils.updateText(
            rows.online.value,
            textCache,
            'online',
            navigator.onLine ? 'Online' : 'Offline'
          );
          rows.online.row.style.display = 'flex';
        } else if (rows.online) {
          rows.online.row.style.display = 'none';
        }

        if (showBattery && rows.battery) {
          if (navigator.battery && typeof navigator.battery.level === 'number') {
            batteryText = Math.round(navigator.battery.level * 100) + '%';
          } else if (navigator.getBattery) {
            batteryText = 'Checking…';
          }

          textCache = utils.updateText(rows.battery.value, textCache, 'battery', batteryText);
          rows.battery.row.style.display = 'flex';
        } else if (rows.battery) {
          rows.battery.row.style.display = 'none';
        }

        if (showSync && rows.sync) {
          textCache = utils.updateText(rows.sync.value, textCache, 'sync', formatSyncTime(syncTs));
          rows.sync.row.style.display = 'flex';
        } else if (rows.sync) {
          rows.sync.row.style.display = 'none';
        }

        if (showVersion && rows.version) {
          textCache = utils.updateText(rows.version.value, textCache, 'version', version || '—');
          rows.version.row.style.display = 'flex';
        } else if (rows.version) {
          rows.version.row.style.display = 'none';
        }

        if (rows.custom) {
          textCache = utils.updateText(rows.custom.value, textCache, 'custom', customText || '—');
          rows.custom.row.style.display = customText ? 'flex' : 'none';
        }
      },

      destroy: function () {
        intervalId = utils.clearTimer(intervalId);

        if (window.removeEventListener) {
          window.removeEventListener('online', card.update, false);
          window.removeEventListener('offline', card.update, false);
        }

        config = null;
        container = null;
        root = null;
        rows = {};
        textCache = {};
      }
    };

    return card;
  }

  AmbientDisplay.cardRegistry.register('status', createStatusCard);
}());
