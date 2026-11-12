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


test('chunked filesystem reads work when createDataFile returns no node',()=>{
 const node={stream_ops:{llseek(){return 12;}}};let created;
 const context={Module:{print(){},printErr(){}},SMBRuntime:{logs:[],send(){}},getZipEntries(){},getEmulatorParams(){return [];},buildBrowserFileSystem(){},createFile(){},window:{addEventListener(){}},document:{addEventListener(){}},FS:{createDataFile(...args){created=args;},lookupPath(path){assert.equal(path,'/game.zip');return {node};}}};
 vm.createContext(context);vm.runInContext(readFileSync(new URL('../runtime/bridge-ready.js',import.meta.url),'utf8'),context);
 const bytes=Uint8Array.of(1,2,3,4);context.createFile('/','game.zip',{chunked:true,length:4,read:(start,length)=>bytes.slice(start,start+length)});
 assert.equal(created[2].length,0);assert.equal(node.usedBytes,4);assert.equal(node.stream_ops.llseek(),12);
 const target=new Uint8Array(6);assert.equal(node.stream_ops.read({},target,2,8,2),2);assert.deepEqual(Array.from(target),[0,0,3,4,0,0]);
});
