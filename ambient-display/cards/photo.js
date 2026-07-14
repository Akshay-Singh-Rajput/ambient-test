/* global AmbientDisplay */
(function () {
  var u = AmbientDisplay.cardUtils;

  function createPhotoCard() {
    return {
      renderTile: function (container, appConfig, cardConfig) {
        var src = u.option(cardConfig, 'src', '');
        var caption = u.option(cardConfig, 'caption', '');
        var img;

        container.appendChild(u.textEl('span', 'tile-card__label', cardConfig.title || 'Photo'));

        if (src) {
          img = document.createElement('img');
          img.className = 'tile-card__photo';
          img.src = src;
          img.alt = caption || 'Photo';
          container.appendChild(img);
        }

        if (caption) {
          container.appendChild(u.textEl('span', 'tile-card__sub', caption));
        }
      },
      renderDetail: function (container, appConfig, cardConfig) {
        var src = u.option(cardConfig, 'src', '');
        var caption = u.option(cardConfig, 'caption', '');
        var img;

        if (src) {
          img = document.createElement('img');
          img.className = 'detail-card__photo';
          img.src = src;
          img.alt = caption || 'Photo';
          container.appendChild(img);
        }

        if (caption) {
          container.appendChild(u.textEl('p', 'detail-card__caption', caption));
        }
      },
      destroyTile: function () {},
      destroyDetail: function () {}
    };
  }

  AmbientDisplay.cardRegistry.register('photo', createPhotoCard);
}());
