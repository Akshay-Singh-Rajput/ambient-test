/**
 * asset-library.js — Asset staging (ES6 module)
 */

const DB_NAME = 'ambient-admin-assets';
const STORE_NAME = 'assets';
let db = null;

const openDb = () => new Promise((resolve, reject) => {
  if (db) return resolve(db);
  const request = indexedDB.open(DB_NAME, 1);
  request.onupgradeneeded = (e) => {
    if (!e.target.result.objectStoreNames.contains(STORE_NAME)) {
      e.target.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
    }
  };
  request.onsuccess = (e) => { db = e.target.result; resolve(db); };
  request.onerror = () => reject(request.error);
});

const buildPublishPath = (file) => {
  const folder = file.type.startsWith('video') ? 'videos' : 'images';
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase();
  return `assets/${folder}/${safeName}`;
};

export const assetLibrary = {
  addFile(file) {
    return openDb().then((database) => {
      const record = {
        id: `asset-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        name: file.name,
        type: file.type,
        size: file.size,
        publishPath: buildPublishPath(file),
        blob: file,
        addedAt: Date.now()
      };
      return new Promise((resolve, reject) => {
        const tx = database.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(record);
        tx.oncomplete = () => resolve(record);
        tx.onerror = () => reject(tx.error);
      });
    });
  },

  listAssets() {
    return openDb().then((database) => new Promise((resolve, reject) => {
      const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    }));
  },

  removeAsset(id) {
    return openDb().then((database) => new Promise((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    }));
  },

  renderGrid(container) {
    assetLibrary.listAssets().then((assets) => {
      container.innerHTML = assets.length
        ? ''
        : '<p class="admin-empty">No assets uploaded yet.</p>';

      assets.forEach((asset) => {
        const card = document.createElement('div');
        card.className = 'admin-asset-card';
        const preview = document.createElement('div');
        preview.className = 'admin-asset-card__preview';

        if (asset.type.startsWith('image')) {
          const img = document.createElement('img');
          img.src = URL.createObjectURL(asset.blob);
          img.alt = asset.name;
          preview.appendChild(img);
        } else {
          preview.textContent = 'Video';
        }

        const meta = document.createElement('div');
        meta.className = 'admin-asset-card__meta';
        meta.innerHTML = `<strong>${asset.name}</strong><code>${asset.publishPath}</code>`;

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'admin-btn admin-btn--ghost admin-btn--small';
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', () => {
          assetLibrary.removeAsset(asset.id).then(() => assetLibrary.renderGrid(container));
        });

        card.append(preview, meta, removeBtn);
        container.appendChild(card);
      });
    });
  },

  bindUpload(dropzone, input, grid) {
    const handleFiles = (files) => {
      [...files].forEach((file) => {
        assetLibrary.addFile(file).then(() => assetLibrary.renderGrid(grid));
      });
    };

    input?.addEventListener('change', () => {
      handleFiles(input.files);
      input.value = '';
    });

    dropzone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('admin-dropzone--active');
    });
    dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('admin-dropzone--active'));
    dropzone?.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('admin-dropzone--active');
      handleFiles(e.dataTransfer.files);
    });

    assetLibrary.renderGrid(grid);
  }
};
