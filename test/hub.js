(function () {
  var HARNESS = '/ambient-display/test/index.html';

  fetch('/test/manifest.json').then(function (response) {
    return response.json();
  }).then(function (manifest) {
    var container = document.getElementById('fixture-groups');
    var groups = {};

    manifest.fixtures.forEach(function (fixture) {
      if (!groups[fixture.group]) {
        groups[fixture.group] = [];
      }
      groups[fixture.group].push(fixture);
    });

    Object.keys(groups).forEach(function (groupName) {
      var section = document.createElement('section');
      section.className = 'hub-group';

      var title = document.createElement('h2');
      title.textContent = groupName;
      section.appendChild(title);

      var grid = document.createElement('div');
      grid.className = 'hub-fixtures';

      groups[groupName].forEach(function (fixture) {
        var link = document.createElement('a');
        link.className = 'hub-fixture';
        link.href = HARNESS + '?fixture=' + encodeURIComponent(fixture.id);
        link.innerHTML = '<strong>' + fixture.name + '</strong><span>' + fixture.description + '</span>';
        grid.appendChild(link);
      });

      section.appendChild(grid);
      container.appendChild(section);
    });
  });
}());
