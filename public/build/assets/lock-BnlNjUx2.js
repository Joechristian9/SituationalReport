import{c as s}from"./utils-D6WWLOnn.js";let n=null;const e=new Set,o=()=>e.forEach(t=>t());window.addEventListener("beforeinstallprompt",t=>{t.preventDefault(),n=t,o()});window.addEventListener("appinstalled",()=>{n=null,o()});const c=()=>window.matchMedia?.("(display-mode: standalone)").matches||window.navigator.standalone===!0,d=()=>/iphone|ipad|ipod/i.test(window.navigator.userAgent)||window.navigator.platform==="MacIntel"&&window.navigator.maxTouchPoints>1,l=()=>n!==null;async function p(){if(!n)return!1;const t=n;n=null,t.prompt();const{outcome:a}=await t.userChoice;return o(),a==="accepted"}function w(t){return e.add(t),()=>e.delete(t)}/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const i=[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 10 0v4",key:"fwvmzm"}]],u=s("lock",i);export{u as L,c as a,l as c,d as i,p,w as s};
