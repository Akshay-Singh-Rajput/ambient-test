/* global AmbientDisplay */
(function () {
  var u = AmbientDisplay.cardUtils;

  function pickDailyQuote(quotes) {
    if (!quotes.length) {
      return { text: 'Add quotes in config.json', author: '' };
    }
    return quotes[u.dayIndex(new Date()) % quotes.length];
  }

  function createQuoteCard() {
    return {
      renderTile: function (container, appConfig, cardConfig) {
        var quotes = u.option(cardConfig, 'quotes', []);
        var quote = pickDailyQuote(quotes);
        var excerpt = quote.text.length > 72 ? quote.text.substring(0, 72) + '\u2026' : quote.text;

        container.appendChild(u.textEl('span', 'tile-card__label', cardConfig.title || 'Quote'));
        container.appendChild(u.textEl('span', 'tile-card__value tile-card__value--quote', '\u201C' + excerpt + '\u201D'));
        if (quote.author) {
          container.appendChild(u.textEl('span', 'tile-card__sub', '\u2014 ' + quote.author));
        }
      },
      renderDetail: function (container, appConfig, cardConfig) {
        var quotes = u.option(cardConfig, 'quotes', []);
        var quote = pickDailyQuote(quotes);

        container.appendChild(u.textEl('blockquote', 'detail-card__quote', '\u201C' + quote.text + '\u201D'));
        if (quote.author) {
          container.appendChild(u.textEl('cite', 'detail-card__quote-author', '\u2014 ' + quote.author));
        }
      },
      destroyTile: function () {},
      destroyDetail: function () {}
    };
  }

  AmbientDisplay.cardRegistry.register('quote', createQuoteCard);
}());
