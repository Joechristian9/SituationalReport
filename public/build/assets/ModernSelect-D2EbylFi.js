import{b as n,j as t}from"./index-d-9UipKu.js";import{C as v,M as w}from"./index-B_vI8sF1.js";function y({value:l,onChange:b,options:u=[],placeholder:m="Select an option",icon:a=null,className:x="",ariaLabel:c}){const[s,r]=n.useState(!1),o=n.useRef(null),i=n.useRef(null);n.useEffect(()=>{const e=h=>{o.current&&!o.current.contains(h.target)&&r(!1)};return document.addEventListener("mousedown",e),()=>document.removeEventListener("mousedown",e)},[]);const p=e=>{e.key==="Escape"&&s&&(e.stopPropagation(),r(!1),i.current?.focus())},d=u.find(e=>e.value===l),f=d?d.label:m;return t.jsxs("div",{className:`relative ${x}`,ref:o,onKeyDown:p,children:[t.jsxs("button",{ref:i,type:"button",onClick:()=>r(!s),"aria-haspopup":"true","aria-expanded":s,"aria-label":c?`${c}: ${f}`:void 0,className:`
                    flex items-center justify-between gap-2
                    ${a?"pl-10":"pl-4"} pr-3 py-2
                    text-sm font-medium text-slate-700
                    bg-white
                    border border-slate-300 rounded-lg
                    shadow-sm
                    hover:bg-slate-50 hover:shadow-md
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                    transition-all duration-200
                    cursor-pointer
                    w-full
                `,children:[a&&t.jsx("div",{className:"absolute left-3 top-1/2 -translate-y-1/2 text-gray-500",children:a}),t.jsx("span",{className:"flex-1 text-left",children:f}),t.jsx(v,{size:16,"aria-hidden":"true",className:`text-slate-500 transition-transform ${s?"rotate-180":""}`})]}),s&&t.jsx("div",{className:"absolute right-0 mt-2 w-full min-w-[160px] bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto",children:u.map(e=>t.jsxs("button",{type:"button","aria-pressed":l===e.value,onClick:()=>{b(e.value),r(!1),i.current?.focus()},className:`
                                w-full text-left px-4 py-2 text-sm
                                flex items-center justify-between
                                hover:bg-blue-50 transition-colors
                                focus:outline-none focus-visible:bg-blue-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500
                                ${l===e.value?"text-blue-600 font-medium bg-blue-50":"text-slate-700"}
                            `,children:[t.jsx("span",{children:e.label}),l===e.value&&t.jsx(w,{size:16,className:"text-blue-500","aria-hidden":"true"})]},e.value))})]})}export{y as M};
