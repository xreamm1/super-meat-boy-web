import test from 'node:test';
import assert from 'node:assert/strict';
import {validateSave} from '../importer.js';
test('save import rejects unrelated data and unsupported native versions',()=>{assert.throws(()=>validateSave({}));const bytes=Array(7336).fill(0);const backup={format:'super-meat-boy-native-save',version:1,files:{'savegame.dat':bytes}};assert.throws(()=>validateSave(backup));bytes[0]=1;assert.equal(validateSave(backup),backup);backup.files['../other']=[0];assert.throws(()=>validateSave(backup));});
