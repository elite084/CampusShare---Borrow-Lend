import { addBookingDemo, addInventoryDemo, seed } from './data.mjs';

let database;

function openDatabase() {
  database ??= new Promise((resolve, reject) => {
    const request = indexedDB.open('campusshare-demo', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('data');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return database;
}

function restore(snapshot) {
  let data = snapshot;
  if (!data) {
    try { data = JSON.parse(localStorage.getItem('campusshare-demo-v1')); } catch { /* The seed remains available. */ }
  }
  if (!data?.listings) return seed();
  addBookingDemo(data);
  addInventoryDemo(data);
  return data;
}

// A single readwrite transaction covers the latest read, validation, and the write.
export async function accessDemo(change) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('data', change ? 'readwrite' : 'readonly');
    const records = transaction.objectStore('data');
    const request = records.get('current');
    let state;
    let result;
    let failure;

    request.onsuccess = () => {
      try {
        state = restore(request.result);
        if (change) {
          result = change(state);
          state.dataRevision = (state.dataRevision ?? 0) + 1;
          records.put(state, 'current');
        }
      } catch (error) {
        failure = error;
        transaction.abort();
      }
    };
    transaction.oncomplete = () => resolve({ state, result });
    transaction.onabort = () => reject(failure ?? transaction.error ?? new Error('The demo update was interrupted. Try again.'));
  });
}
