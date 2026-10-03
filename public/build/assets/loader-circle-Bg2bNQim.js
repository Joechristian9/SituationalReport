import{c as d}from"./button-B779lBis.js";const y="modulepreload",v=function(l){return"/build/"+l},u={},_=function(m,s,C){let i=Promise.resolve();if(s&&s.length>0){let f=function(e){return Promise.all(e.map(o=>Promise.resolve(o).then(c=>({status:"fulfilled",value:c}),c=>({status:"rejected",reason:c}))))};document.getElementsByTagName("link");const n=document.querySelector("meta[property=csp-nonce]"),t=n?.nonce||n?.getAttribute("nonce");i=f(s.map(e=>{if(e=v(e),e in u)return;u[e]=!0;const o=e.endsWith(".css"),c=o?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${e}"]${c}`))return;const r=document.createElement("link");if(r.rel=o?"stylesheet":y,o||(r.as="script"),r.crossOrigin="",r.href=e,t&&r.setAttribute("nonce",t),document.head.appendChild(r),o)return new Promise((h,p)=>{r.addEventListener("load",h),r.addEventListener("error",()=>p(new Error(`Unable to preload CSS for ${e}`)))})}))}function a(n){const t=new Event("vite:preloadError",{cancelable:!0});if(t.payload=n,window.dispatchEvent(t),!t.defaultPrevented)throw n}return i.then(n=>{for(const t of n||[])t.status==="rejected"&&a(t.reason);return m().catch(a)})};/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const k=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]],g=d("circle-check",k);/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const E=[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]],w=d("loader-circle",E);export{g as C,w as L,_};
