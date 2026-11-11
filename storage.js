export const DB_NAME='smb-local-v1';
export function openDB(){return new Promise((resolve,reject)=>{
 const r=indexedDB.open(DB_NAME,2);let blocked=false;
 r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('files'))r.result.createObjectStore('files');};
 r.onsuccess=()=>{const db=r.result;if(blocked){db.close();return;}db.onversionchange=()=>db.close();if(!db.objectStoreNames.contains('files')){db.close();reject(new Error('В базе локальных данных отсутствует раздел files'));return;}resolve(db);};
 r.onerror=()=>reject(r.error);
 r.onblocked=()=>{blocked=true;reject(new Error('Закройте другие вкладки Super Meat Boy и перезапустите эту страницу, чтобы обновить хранилище сейвов'));};
});}
export async function getFile(key){const db=await openDB();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('files');const r=tx.objectStore('files').get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}finally{db.close();}}
export async function putFile(key,value){const db=await openDB();try{await new Promise((resolve,reject)=>{const tx=db.transaction('files','readwrite');tx.objectStore('files').put(value,key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Запись прервана'));});}finally{db.close();}}
