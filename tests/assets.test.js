import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto,createHash} from 'node:crypto';
import vm from 'node:vm';

async function run(corrupt=false){
 const first=Uint8Array.of(1,2,3),second=Uint8Array.of(4,5,6);const hash=b=>createHash('sha256').update(b).digest('hex');
 const manifest={'game.zip':{size:6,parts:[{url:'first',size:3,sha256:hash(first)},{url:'second',size:3,sha256:hash(second)}]},'wine.zip':{parts:[]}};
 const messages=[];let output;let active=0,maxActive=0;
 const context={document:{addEventListener(){}},navigator:{hardwareConcurrency:12},crypto:webcrypto,AbortController,location:{origin:'https://unit.test'},parent:{postMessage:m=>messages.push(m)},addEventListener(){},fetch:async url=>{
  if(url.includes('assets.json'))return {ok:true,json:async()=>manifest};
  active++;maxActive=Math.max(maxActive,active);let sent=false;
  return {ok:true,body:new ReadableStream({pull(controller){if(!sent){sent=true;controller.enqueue(url==='first'?first:corrupt?Uint8Array.of(9,5,6):second);}else{active--;controller.close();}}})};
 }};context.window=context;vm.createContext(context);vm.runInContext(readFileSync(new URL('../runtime/bridge.js',import.meta.url),'utf8'),context);
 await context.SMBRuntime.loadFile('','game.zip',bytes=>output={all:Array.from(bytes.read(0,bytes.length)),cross:Array.from(bytes.read(2,3)),eof:Array.from(bytes.read(5,9)),chunked:bytes.chunked});return {output,messages,maxActive};
}
test('asset parts assemble in manifest order with at most two streams',async()=>{const r=await run();assert.deepEqual(r.output,{all:[1,2,3,4,5,6],cross:[3,4,5],eof:[6],chunked:true});assert.ok(r.maxActive<=2);const progress=r.messages.filter(m=>m.type==='download').map(m=>m.done);assert.equal(progress.at(-1),6);assert.deepEqual(progress,[...progress].sort((a,b)=>a-b));});
test('a damaged asset never starts the runtime',async()=>{const r=await run(true);assert.equal(r.output,undefined);assert.ok(r.messages.some(m=>m.type==='error'&&m.details.includes('целостности')));});
