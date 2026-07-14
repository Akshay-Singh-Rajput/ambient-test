/* global AmbientDisplay */
(function () {
  var u = AmbientDisplay.cardUtils;

  function createMusicCard() {
    return {
      renderTile: function (container, appConfig, cardConfig) {
        var tracks = u.option(cardConfig, 'tracks', []);
        var playlist = u.option(cardConfig, 'playlist', 'Playlist');
        var now = u.option(cardConfig, 'nowPlaying', 0);
        var current = tracks[now] || null;

        container.appendChild(u.textEl('span', 'tile-card__label', cardConfig.title || 'Music'));
        if (current) {
          container.appendChild(u.textEl('span', 'tile-card__value', current.title));
          container.appendChild(u.textEl('span', 'tile-card__meta', current.artist));
        }
        container.appendChild(u.textEl('span', 'tile-card__sub', playlist));
      },
      renderDetail: function (container, appConfig, cardConfig) {
        var tracks = u.option(cardConfig, 'tracks', []);
        var playlist = u.option(cardConfig, 'playlist', 'Playlist');
        var now = u.option(cardConfig, 'nowPlaying', 0);
        var current = tracks[now] || tracks[0];
        var i;
        var row;
        var art;
        var controls;

        container.appendChild(u.textEl('p', 'detail-card__subtitle', playlist));

        if (current) {
          art = document.createElement('div');
          art.className = 'detail-card__music-art';
          container.appendChild(art);
          container.appendChild(u.textEl('p', 'detail-card__music-title', current.title));
          container.appendChild(u.textEl('p', 'detail-card__music-artist', current.artist));

          controls = document.createElement('div');
          controls.className = 'detail-card__music-controls';
          controls.appendChild(u.textEl('span', 'detail-card__music-btn', '\u23EE'));
          controls.appendChild(u.textEl('span', 'detail-card__music-btn detail-card__music-btn--play', '\u25B6'));
          controls.appendChild(u.textEl('span', 'detail-card__music-btn', '\u23ED'));
          container.appendChild(controls);
        }

        var list = document.createElement('div');
        list.className = 'detail-card__list';
        for (i = 0; i < tracks.length; i++) {
          row = document.createElement('div');
          row.className = 'detail-card__row' + (i === now ? ' detail-card__row--active' : '');
          row.appendChild(u.textEl('span', 'detail-card__row-title', tracks[i].title));
          row.appendChild(u.textEl('span', 'detail-card__row-meta', tracks[i].artist));
          row.appendChild(u.textEl('span', 'detail-card__row-value', tracks[i].duration));
          list.appendChild(row);
        }
        container.appendChild(list);
      },
      destroyTile: function () {},
      destroyDetail: function () {}
    };
  }

  AmbientDisplay.cardRegistry.register('music', createMusicCard);
}());
