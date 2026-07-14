/**
 * refresh-control.js — Tiny manual refresh control for kiosk display (ES5)
 */

(function () {
  function createRefreshIcon() {
    var svg;
    var path;

    if (document.createElementNS) {
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'ambient-refresh__icon');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');

      path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute(
        'd',
        'M17.65 6.35A7.96 7.96 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08a5.99 5.99 0 0 1-5.65 4c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z'
      );
      path.setAttribute('fill', 'currentColor');
      svg.appendChild(path);
      return svg;
    }

    svg = document.createElement('span');
    svg.className = 'ambient-refresh__icon ambient-refresh__icon--fallback';
    svg.setAttribute('aria-hidden', 'true');
    svg.textContent = '\u21BB';
    return svg;
  }

  function mount() {
    var root = document.getElementById('ambient-root');
    var btn;

    if (!root) {
      return;
    }

    if (root.querySelector('.ambient-refresh')) {
      return;
    }

    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ambient-refresh';
    btn.setAttribute('aria-label', 'Refresh display');
    btn.setAttribute('title', 'Refresh display');
    btn.appendChild(createRefreshIcon());

    btn.addEventListener('click', function () {
      window.location.reload();
    }, false);

    root.appendChild(btn);
  }

  window.AmbientRefreshControl = {
    mount: mount
  };
}());
