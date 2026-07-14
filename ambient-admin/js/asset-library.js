/**
 * asset-library.js — Asset staging for Ambient Display Admin
 *
 * Stores uploaded images and videos in IndexedDB until publish copies them
 * into ambient-display/assets/.
 */

var AmbientAdmin = AmbientAdmin || {};

AmbientAdmin.assetLibrary = (function () {
  var DB_NAME = 'ambient-admin-assets';
  var STORE_NAME = 'assets';
  var db = null;

  function openDb() {
    return new Promise(function (resolve, reject) {
      if (db) {
        resolve(db);
        return;
      }

      var request = indexedDB.open(DB_NAME, 1);

      request.onupgradeneeded = function (event) {
        var database = event.target.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = function (event) {
        db = event.target.result;
        resolve(db);
      };

      request.onerror = function () {
        reject(request.error);
      };
    });
  }

  function makeId() {
    return 'asset-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
  }

  function buildPublishPath(file) {
    var folder = file.type.indexOf('video') === 0 ? 'videos' : 'images';
    var safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase();
    return 'assets/' + folder + '/' + safeName;
  }

  function addFile(file) {
    return openDb().then(function (database) {
      var record = {
        id: makeId(),
        name: file.name,
        type: file.type,
        size: file.size,
        publishPath: buildPublishPath(file),
        blob: file,
        addedAt: Date.now()
      };

      return new Promise(function (resolve, reject) {
        var tx = database.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(record);
        tx.oncomplete = function () { resolve(record); };
        tx.onerror = function () { reject(tx.error); };
      });
    });
  }

  function listAssets() {
    return openDb().then(function (database) {
      return new Promise(function (resolve, reject) {
        var tx = database.transaction(STORE_NAME, 'readonly');
        var request = tx.objectStore(STORE_NAME).getAll();
        request.onsuccess = function () { resolve(request.result || []); };
        request.onerror = function () { reject(request.error); };
      });
    });
  }

  function removeAsset(id) {
    return openDb().then(function (database) {
      return new Promise(function (resolve, reject) {
        var tx = database.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(id);
        tx.oncomplete = function () { resolve(true); };
        tx.onerror = function () { reject(tx.error); };
      });
    });
  }

  function renderGrid(container) {
    listAssets().then(function (assets) {
      container.innerHTML = '';

      if (!assets.length) {
        container.innerHTML = '<p class="admin-empty">No assets uploaded yet.</p>';
        return;
      }

      assets.forEach(function (asset) {
        var card = document.createElement('div');
        card.className = 'admin-asset-card';

        var preview = document.createElement('div');
        preview.className = 'admin-asset-card__preview';

        if (asset.type.indexOf('image') === 0) {
          var img = document.createElement('img');
          img.src = URL.createObjectURL(asset.blob);
          img.alt = asset.name;
          preview.appendChild(img);
        } else {
          preview.textContent = 'Video';
        }

        var meta = document.createElement('div');
        meta.className = 'admin-asset-card__meta';
        meta.innerHTML = '<strong>' + asset.name + '</strong><code>' + asset.publishPath + '</code>';

        var removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'admin-btn admin-btn--ghost admin-btn--small';
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', function () {
          removeAsset(asset.id).then(function () {
            renderGrid(container);
          });
        });

        card.appendChild(preview);
        card.appendChild(meta);
        card.appendChild(removeBtn);
        container.appendChild(card);
      });
    });
  }

  function bindUpload(dropzone, input, grid) {
    function handleFiles(files) {
      Array.from(files).forEach(function (file) {
        addFile(file).then(function () {
          renderGrid(grid);
        });
      });
    }

    input.addEventListener('change', function () {
      handleFiles(input.files);
      input.value = '';
    });

    dropzone.addEventListener('dragover', function (event) {
      event.preventDefault();
      dropzone.classList.add('admin-dropzone--active');
    });

    dropzone.addEventListener('dragleave', function () {
      dropzone.classList.remove('admin-dropzone--active');
    });

    dropzone.addEventListener('drop', function (event) {
      event.preventDefault();
      dropzone.classList.remove('admin-dropzone--active');
      handleFiles(event.dataTransfer.files);
    });
  }

  return {
    addFile: addFile,
    listAssets: listAssets,
    removeAsset: removeAsset,
    renderGrid: renderGrid,
    bindUpload: bindUpload
  };
})();
