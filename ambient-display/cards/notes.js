/* global AmbientDisplay */
(function () {
  var u = AmbientDisplay.cardUtils;

  function createNotesCard() {
    return {
      renderTile: function (container, appConfig, cardConfig) {
        var notes = u.option(cardConfig, 'notes', []);
        var pinned = [];
        var i;
        var preview = 'No notes';

        for (i = 0; i < notes.length; i++) {
          if (notes[i].pinned) {
            pinned.push(notes[i]);
          }
        }

        if (pinned.length) {
          preview = pinned[0].text;
        } else if (notes.length) {
          preview = notes[0].text;
        }

        container.appendChild(u.textEl('span', 'tile-card__label', cardConfig.title || 'Notes'));
        container.appendChild(u.textEl('span', 'tile-card__value tile-card__value--sm', preview));
        container.appendChild(u.textEl('span', 'tile-card__sub', pinned.length + ' pinned'));
      },
      renderDetail: function (container, appConfig, cardConfig) {
        var notes = u.option(cardConfig, 'notes', []);
        var i;
        var row;
        var box;
        var list = document.createElement('div');
        list.className = 'detail-card__notes';

        for (i = 0; i < notes.length; i++) {
          row = document.createElement('div');
          row.className = 'detail-card__note' + (notes[i].pinned ? ' detail-card__note--pinned' : '');

          box = document.createElement('span');
          box.className = 'detail-card__checkbox' + (notes[i].checked ? ' detail-card__checkbox--checked' : '');
          row.appendChild(box);
          row.appendChild(u.textEl('span', 'detail-card__note-text' + (notes[i].checked ? ' detail-card__note-text--done' : ''), notes[i].text));
          list.appendChild(row);
        }

        container.appendChild(list);
      },
      destroyTile: function () {},
      destroyDetail: function () {}
    };
  }

  AmbientDisplay.cardRegistry.register('notes', createNotesCard);
}());
