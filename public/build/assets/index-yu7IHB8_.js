import{c as p,R as r,D as I,j as m,F as S,b as v}from"./button-oBRmgf7s.js";import{c as D}from"./index-nSegvi8j.js";/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const O=[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]],b=p("check",O);/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const g=[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]],q=p("chevron-right",g);/**
 * @license lucide-react v0.542.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const L=[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}],["path",{d:"M12 7v5l4 2",key:"1fdv2h"}]],$=p("history",L);function H(s){const i=s+"CollectionProvider",[y,_]=D(i),[N,d]=y(i,{collectionRef:{current:null},itemMap:new Map}),C=c=>{const{scope:e,children:l}=c,t=r.useRef(null),o=r.useRef(new Map).current;return m.jsx(N,{scope:e,itemMap:o,collectionRef:t,children:l})};C.displayName=i;const u=s+"CollectionSlot",E=S(u),h=r.forwardRef((c,e)=>{const{scope:l,children:t}=c,o=d(u,l),n=I(e,o.collectionRef);return m.jsx(E,{ref:n,children:t})});h.displayName=u;const f=s+"CollectionItemSlot",x="data-radix-collection-item",A=S(f),R=r.forwardRef((c,e)=>{const{scope:l,children:t,...o}=c,n=r.useRef(null),M=I(e,n),a=d(f,l);return r.useEffect(()=>(a.itemMap.set(n,{ref:n,...o}),()=>void a.itemMap.delete(n))),m.jsx(A,{[x]:"",ref:M,children:t})});R.displayName=f;function k(c){const e=d(s+"CollectionConsumer",c);return r.useCallback(()=>{const t=e.collectionRef.current;if(!t)return[];const o=Array.from(t.querySelectorAll(`[${x}]`));return Array.from(e.itemMap.values()).sort((a,T)=>o.indexOf(a.ref.current)-o.indexOf(T.ref.current))},[e.collectionRef,e.itemMap])}return[{Provider:C,Slot:h,ItemSlot:R},k,_]}var j=v.createContext(void 0);function F(s){const i=v.useContext(j);return s||i||"ltr"}export{q as C,$ as H,b as a,H as c,F as u};
