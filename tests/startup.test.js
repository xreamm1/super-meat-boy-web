import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

test('Windows CRLF and NUL console records complete native initialization',()=>{
 const events=[];
 const context={Module:{print(){},printErr(){}},SMBRuntime:{logs:[],ready:false,send:(type,data)=>events.push({type,...data})},getEmulatorParams(){return ['/bin/wine'];},buildBrowserFileSystem(){},window:{addEventListener(){}},document:{addEventListener(){}}};
 vm.createContext(context);
 vm.runInContext(readFileSync(new URL('../runtime/bridge-ready.js',import.meta.url),'utf8'),context);
 context.Module.print('Creating Texture Package: pc/Menus/portal.tp\r');
 assert.equal(context.SMBRuntime.ready,false);
 context.Module.print('\0[MIPS] count=60 raw=700\r');
 assert.equal(context.SMBRuntime.ready,true);
 assert.equal(events.filter(e=>e.type==='ready').length,1);
 context.Module.print('[MIPS] count=70 raw=700');
 assert.equal(events.filter(e=>e.type==='ready').length,1);
});
