import{c as l}from"./utils-D6WWLOnn.js";const r="offline-lock",d=31e4,f=900*1e3,s=5,i=new Set;function a(){try{return JSON.parse(localStorage.getItem(r))||null}catch{return null}}function c(t){try{t?localStorage.setItem(r,JSON.stringify(t)):localStorage.removeItem(r)}catch{}i.forEach(e=>e())}const u=t=>btoa(String.fromCharCode(...new Uint8Array(t))),k=t=>Uint8Array.from(atob(t),e=>e.charCodeAt(0)),y=(t,e)=>!!(t&&e&&t.email===e.trim().toLowerCase());async function h(t,e,o){const n=await crypto.subtle.importKey("raw",new TextEncoder().encode(t),"PBKDF2",!1,["deriveBits"]);return u(await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt:e,iterations:o},n,256))}async function g(t,e){if(!globalThis.crypto?.subtle||!t||!e)return;const o=crypto.getRandomValues(new Uint8Array(16));c({email:t.trim().toLowerCase(),salt:u(o),hash:await h(e,o,d),iterations:d,locked:!1,tries:0,lastActive:Date.now()})}const v=()=>c(null),S=t=>y(a(),t);function b(t,{idleLock:e=!0}={}){const o=a();return y(o,t)?o.locked||e&&Date.now()-o.lastActive>f:!1}function L(){const t=a();t&&!t.locked&&c({...t,locked:!0})}function I(){const t=a(),e=t?Date.now()-t.lastActive:0;if(t&&!t.locked&&e>3e4&&e<f)try{localStorage.setItem(r,JSON.stringify({...t,lastActive:Date.now()}))}catch{}}const D=()=>Math.max(0,s-(a()?.tries??0));async function M(t){const e=a();if(!e||e.tries>=s)return"blocked";if(await h(t,k(e.salt),e.iterations)===e.hash)return c({...e,locked:!1,tries:0,lastActive:Date.now()}),"ok";const n=e.tries+1;return c({...e,locked:!0,tries:n}),n>=s?"blocked":"wrong"}function _(t){return i.add(t),()=>i.delete(t)}/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const m=[["path",{d:"m2 2 20 20",key:"1ooewy"}],["path",{d:"M5.782 5.782A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.307-.193",key:"yfwify"}],["path",{d:"M21.532 16.5A4.5 4.5 0 0 0 17.5 10h-1.79A7.008 7.008 0 0 0 10 5.07",key:"jlfiyv"}]],B=l("cloud-off",m);/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const w=[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 10 0v4",key:"fwvmzm"}]],C=l("lock",w);/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const A=[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",key:"wmoenq"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]],E=l("triangle-alert",A);export{B as C,C as L,E as T,S as c,v as f,b as i,L as l,I as n,g as r,_ as s,D as t,M as u};
