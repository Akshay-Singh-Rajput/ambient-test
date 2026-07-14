/**
 * card-utils.js — Shared card helpers (ES5)
 */

/* global AmbientDisplay */
var AmbientDisplay = AmbientDisplay || {};

AmbientDisplay.cardUtils = (function () {
  function option(cardConfig, key, fallback) {
    var options = cardConfig && cardConfig.options ? cardConfig.options : {};
    return options.hasOwnProperty(key) ? options[key] : fallback;
  }

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function clearEl(el) {
    if (!el) {
      return;
    }
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
  }

  function textEl(tag, className, text) {
    var node = document.createElement(tag);
    if (className) {
      node.className = className;
    }
    if (text !== undefined && text !== null) {
      node.appendChild(document.createTextNode(String(text)));
    }
    return node;
  }

  function dayIndex(date) {
    return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  }

  function parseDateLabel(value) {
    var lower = String(value).toLowerCase();
    var today = new Date();
    var target;
    var parts;
    var y;
    var m;
    var d;

    if (lower === 'today') {
      target = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      return { sortKey: target.getTime(), label: 'Today' };
    }

    if (lower === 'tomorrow') {
      target = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      return { sortKey: target.getTime(), label: 'Tomorrow' };
    }

    parts = String(value).split('-');
    if (parts.length === 3) {
      y = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10) - 1;
      d = parseInt(parts[2], 10);
      target = new Date(y, m, d);
      return {
        sortKey: target.getTime(),
        label: target.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      };
    }

    return { sortKey: 9999999999999, label: String(value) };
  }

  function sortTimelineItems(items) {
    var mapped = [];
    var i;
    var item;
    var parsed;

    for (i = 0; i < items.length; i++) {
      item = items[i];
      parsed = parseDateLabel(item.date || 'today');
      mapped.push({
        raw: item,
        sortKey: parsed.sortKey,
        timeKey: item.time ? item.time : '99:99',
        dateLabel: parsed.label
      });
    }

    mapped.sort(function (a, b) {
      if (a.sortKey !== b.sortKey) {
        return a.sortKey - b.sortKey;
      }
      return a.timeKey < b.timeKey ? -1 : a.timeKey > b.timeKey ? 1 : 0;
    });

    return mapped;
  }

  function greetingForHour(hour) {
    if (hour >= 5 && hour < 12) {
      return 'Good Morning';
    }
    if (hour >= 12 && hour < 17) {
      return 'Good Afternoon';
    }
    if (hour >= 17 && hour < 21) {
      return 'Good Evening';
    }
    return 'Good Night';
  }

  return {
    option: option,
    pad: pad,
    clearEl: clearEl,
    textEl: textEl,
    dayIndex: dayIndex,
    sortTimelineItems: sortTimelineItems,
    greetingForHour: greetingForHour
  };
}());
