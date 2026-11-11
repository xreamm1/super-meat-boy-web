export class KeyState{
 constructor(send){this.sources=new Map();this.active=new Set();this.send=send;}
 set(source,keys){this.sources.set(source,new Set(keys));this.reconcile();}
 release(source){this.sources.delete(source);this.reconcile();}
 clear(){this.sources.clear();this.reconcile();}
 reconcile(){const next=new Set([...this.sources.values()].flatMap(s=>[...s]));for(const key of this.active)if(!next.has(key))this.send(key,false);for(const key of next)if(!this.active.has(key))this.send(key,true);this.active=next;}
}
export function setupInput(frame){const state=new KeyState((code,down)=>frame.contentWindow?.postMessage({smb:true,type:'key',code,down},location.origin));const supported=new Set(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','ShiftLeft','ShiftRight','Escape']);const code=e=>e.code==='ShiftRight'?'ShiftLeft':e.code;
 window.addEventListener('keydown',e=>{if(!supported.has(e.code)||e.target.closest?.('dialog,input,select'))return;e.preventDefault();state.set('keyboard-'+e.code,[code(e)]);});window.addEventListener('keyup',e=>state.release('keyboard-'+e.code));
 for(const button of document.querySelectorAll('[data-key]')){button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);state.set(e.pointerId,[button.dataset.key]);button.classList.add('held');});const release=e=>{state.release(e.pointerId);button.classList.toggle('held',state.active.has(button.dataset.key));};for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,release);}
 const zone=document.querySelector('#stickZone'),base=document.querySelector('#stick'),knob=base.firstElementChild;let pointer=null,origin;
 zone.addEventListener('pointerdown',e=>{if(pointer!==null)return;e.preventDefault();pointer=e.pointerId;zone.setPointerCapture(pointer);const rect=zone.getBoundingClientRect();origin={x:e.clientX,y:e.clientY};base.style.left=e.clientX-rect.left+'px';base.style.top=e.clientY-rect.top+'px';base.style.display='block';});
 zone.addEventListener('pointermove',e=>{if(e.pointerId!==pointer)return;let dx=e.clientX-origin.x,dy=e.clientY-origin.y;const length=Math.hypot(dx,dy);if(length>42){dx*=42/length;dy*=42/length;}knob.style.transform=`translate(${dx}px,${dy}px)`;const keys=[];if(dx<-10)keys.push('ArrowLeft');if(dx>10)keys.push('ArrowRight');if(dy<-24)keys.push('ArrowUp');if(dy>24)keys.push('ArrowDown');state.set(pointer,keys);});
 const releaseStick=e=>{if(e.pointerId!==pointer)return;state.release(pointer);pointer=null;base.style.display='none';knob.style.transform='';};for(const event of ['pointerup','pointercancel','lostpointercapture'])zone.addEventListener(event,releaseStick);
 const clear=()=>{state.clear();pointer=null;base.style.display='none';document.querySelectorAll('.held').forEach(el=>el.classList.remove('held'));};window.addEventListener('blur',clear);document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});window.addEventListener('orientationchange',clear);window.addEventListener('resize',clear);frame.addEventListener('load',clear);return {state,clear};
}
