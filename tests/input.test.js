import test from 'node:test';
import assert from 'node:assert/strict';
import {KeyState} from '../input.js';
test('independent fingers retain shared keys and cancel clears all keys',()=>{const events=[];const s=new KeyState((...e)=>events.push(e));s.set(1,['ArrowRight']);s.set(2,['ShiftLeft']);s.set(3,['Space']);s.set(4,['Space']);s.release(3);assert.equal(s.active.has('Space'),true);s.release(4);assert.equal(s.active.has('Space'),false);s.clear();assert.equal(s.active.size,0);assert.deepEqual(events,[['ArrowRight',true],['ShiftLeft',true],['Space',true],['Space',false],['ArrowRight',false],['ShiftLeft',false]]);});
