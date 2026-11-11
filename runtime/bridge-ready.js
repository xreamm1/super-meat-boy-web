const originalPrint=Module.print;
Module.print=function(...args){originalPrint(...args);const line=args.join(' ').replace(/\0/g,'').trim();SMBRuntime.logs.push(line);if(SMBRuntime.logs.length>80)SMBRuntime.logs.shift();if(line.startsWith('Launching '))SMBRuntime.send('phase',{phase:'wine'});if(line.startsWith('Creating Texture Package:'))SMBRuntime.send('game-file',{name:line.slice(26)});if(line==='Creating Texture Package: pc/Menus/portal.tp')SMBRuntime.assetsLoaded=true;if(SMBRuntime.assetsLoaded&&line.startsWith('[MIPS]')&&!SMBRuntime.ready){SMBRuntime.ready=true;SMBRuntime.send('ready');}};
const originalErr=Module.printErr;
Module.printErr=function(...args){originalErr(...args);const line=args.join(' ').replace(/\0/g,'').trim();if(/Aborted|out of memory|RuntimeError|unreachable|Unhandled promise rejection|unhandled exception|page fault|stack overflow/i.test(line))SMBRuntime.fail('Исполнение игры прервано',SMBRuntime.logs.join('\n')+'\n'+line);};
const originalInit=Module.onRuntimeInitialized;
Module.onRuntimeInitialized=function(){originalInit?.();SMBRuntime.send('phase',{phase:'module'});};
const originalBuild=buildBrowserFileSystem;
buildBrowserFileSystem=async function(){let db;try{
 const {openDB}=await import('../storage.js?v=14');db=await openDB();
 const pending=await new Promise((resolve,reject)=>{const tx=db.transaction('files');const request=tx.objectStore('files').get('pending-save');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
 if(pending){await SMBRuntime.applySave(pending.files);await new Promise((resolve,reject)=>{const tx=db.transaction('files','readwrite');tx.objectStore('files').delete('pending-save');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Запись сейва прервана'));});}
 SMBRuntime.send('phase',{phase:'saves'});originalBuild();
 }catch(e){SMBRuntime.fail('Не удалось восстановить сейв до запуска',e);}finally{db?.close();}};
Module.locateFile=(name)=>name;
Module.onAbort=reason=>SMBRuntime.fail('Рантайм остановлен',reason);
const fetchWasm=async()=>{try{const response=await fetch('boxedwine.wasm');if(!response.ok)throw Error('HTTP '+response.status);const total=4395227;const bytes=new Uint8Array(total);let done=0;const reader=response.body.getReader();for(;;){const r=await reader.read();if(r.done)break;bytes.set(r.value,done);done+=r.value.length;SMBRuntime.send('download',{name:'boxedwine.wasm',done,total});}if(done!==total)throw Error('Неполный модуль');SMBRuntime.filesDone++;const manifest=await SMBRuntime.manifest;SMBRuntime.send('file-complete',{done:SMBRuntime.filesDone,total:manifest['game.zip'].parts.length+manifest['wine.zip'].parts.length+1});return bytes;}catch(e){SMBRuntime.fail('Не удалось загрузить WASM',e);throw e;}};
Module.instantiateWasm=(imports,receive)=>{
 const env=imports.env;let frames=0,start=performance.now();
 const record=()=>{if(!SMBRuntime.assetsLoaded)return;frames++;const now=performance.now();if(now-start>=1000){SMBRuntime.send('performance',{fps:Math.round(frames*1000/(now-start))});frames=0;start=now;}};
 const present=env.boxedwinePresentCurrentWebGLFrame;
 if(present)env.boxedwinePresentCurrentWebGLFrame=(...args)=>{let result;if(typeof GL==='undefined'||GL.currentContext?.GLctx?.canvas!==Module.canvas)result=present(...args);record();return result;};
 const software=env.boxedwinePresentSoftwareFrame;
 if(software)env.boxedwinePresentSoftwareFrame=(...args)=>{const result=software(...args);record();return result;};
 fetchWasm().then(bytes=>WebAssembly.instantiate(bytes,imports)).then(result=>receive(result.instance,result.module)).catch(e=>SMBRuntime.fail('Браузер не смог создать WASM-рантайм',e));return {};};

const resumeAudio=()=>{const context=Module.boxedwineAudio?.context;if(context&&['suspended','interrupted'].includes(context.state))context.resume().catch(()=>{});};
for(const event of ['pointerdown','keydown','pageshow','focus'])window.addEventListener(event,resumeAudio,true);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)resumeAudio();});

const nativeParameters=getEmulatorParams;
getEmulatorParams=function(){const args=nativeParameters();const index=args.indexOf('/bin/wine');if(index>=0)args.splice(index,0,'-pollRate','0');return args;};
