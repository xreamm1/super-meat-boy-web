import test from 'node:test';
import assert from 'node:assert/strict';
import {IDBFactory} from 'fake-indexeddb';
import {DB_NAME,openDB,getFile,putFile} from '../storage.js';

function legacy(withFiles){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,1);r.onupgradeneeded=()=>{if(withFiles)r.result.createObjectStore('files');};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}

test('first launch creates the files store without requiring an imported save',async()=>{
 globalThis.indexedDB=new IDBFactory();const db=await openDB();assert.equal(db.version,2);assert.equal(db.objectStoreNames.contains('files'),true);db.close();assert.equal(await getFile('pending-save'),undefined);
});
test('an empty schema-1 database left by the old runtime is repaired',async()=>{
 globalThis.indexedDB=new IDBFactory();const broken=await legacy(false);assert.equal(broken.objectStoreNames.length,0);broken.close();const repaired=await openDB();assert.equal(repaired.version,2);assert.equal(repaired.objectStoreNames.contains('files'),true);repaired.close();assert.equal(await getFile('pending-save'),undefined);await putFile('backup',{progress:13});assert.deepEqual(await getFile('backup'),{progress:13});
});
test('schema migration preserves an existing pending native-save import',async()=>{
 globalThis.indexedDB=new IDBFactory();const db=await legacy(true);const value={format:'super-meat-boy-native-save',version:1,files:{'savegame.dat':[1,0,0,0]}};
 await new Promise((resolve,reject)=>{const tx=db.transaction('files','readwrite');tx.objectStore('files').put(value,'pending-save');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close();assert.deepEqual(await getFile('pending-save'),value);
});
