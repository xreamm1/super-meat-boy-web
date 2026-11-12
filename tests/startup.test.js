import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

test('Windows CRLF and NUL console records complete native initialization',()=>{
 const events=[];
 const context={Module:{print(){},printErr(){}},SMBRuntime:{logs:[],ready:false,send:(type,data)=>events.push({type,...data})},getZipEntries(){},createFile(){},getEmulatorParams(){return ['/bin/wine'];},buildBrowserFileSystem(){},window:{addEventListener(){}},document:{addEventListener(){}}};
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


test('chunked ZIP directory preserves entries and archive offsets',()=>{
 const source=readFileSync(new URL('../runtime/boxedwine-shell.js',import.meta.url),'utf8');
 const parser=source.slice(source.indexOf('function getZipEntries(data)'),source.indexOf('// Returns the uncompressed bytes of a getZipEntries() entry.'));
 const context={TextDecoder,Module:{print(){},printErr(){}},SMBRuntime:{logs:[],send(){}},getEmulatorParams(){return [];},buildBrowserFileSystem(){},createFile(){},window:{addEventListener(){}},document:{addEventListener(){}}};
 vm.createContext(context);vm.runInContext(parser,context);vm.runInContext(readFileSync(new URL('../runtime/bridge-ready.js',import.meta.url),'utf8'),context);
 const name=new TextEncoder().encode('game/SuperMeatBoy.exe');const start=100,bytes=new Uint8Array(start+46+name.length+22),view=new DataView(bytes.buffer);
 view.setUint32(start,0x02014b50,true);view.setUint16(start+28,name.length,true);view.setUint32(start+42,29,true);bytes.set(name,start+46);
 const end=start+46+name.length;view.setUint32(end,0x06054b50,true);view.setUint16(end+8,1,true);view.setUint32(end+16,start,true);
 const entries=context.getZipEntries({chunked:true,length:bytes.length,read:(offset,length)=>bytes.slice(offset,offset+length)});
 assert.equal(entries[1].filename,'game/SuperMeatBoy.exe');assert.equal(entries[1].localHeaderOffset,29);
});
