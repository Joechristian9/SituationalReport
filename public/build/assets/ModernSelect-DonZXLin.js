import{b as o,j as t}from"./index-JljlAZsS.js";import{C as b,a as h}from"./history-BNcq9dxt.js";function v({value:s,onChange:d,options:u=[],placeholder:c="Select an option",icon:l=null,className:m=""}){const[r,a]=o.useState(!1),n=o.useRef(null);o.useEffect(()=>{const e=x=>{n.current&&!n.current.contains(x.target)&&a(!1)};return document.addEventListener("mousedown",e),()=>document.removeEventListener("mousedown",e)},[]);const i=u.find(e=>e.value===s),f=i?i.label:c;return t.jsxs("div",{className:`relative ${m}`,ref:n,children:[t.jsxs("button",{onClick:()=>a(!r),className:`
                    flex items-center justify-between gap-2
                    ${l?"pl-10":"pl-4"} pr-3 py-2
                    text-sm font-medium text-slate-700
                    bg-white
                    border border-slate-300 rounded-lg
                    shadow-sm
                    hover:bg-slate-50 hover:shadow-md
                    focus:outline-none focus:ring-2 focus:ring-blue-200
                    transition-all duration-200
                    cursor-pointer
                    w-full
                `,children:[l&&t.jsx("div",{className:"absolute left-3 top-1/2 -translate-y-1/2 text-gray-500",children:l}),t.jsx("span",{className:"flex-1 text-left",children:f}),t.jsx(b,{size:16,className:`text-slate-500 transition-transform ${r?"rotate-180":""}`})]}),r&&t.jsx("div",{className:"absolute right-0 mt-2 w-full min-w-[160px] bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto",children:u.map(e=>t.jsxs("button",{onClick:()=>{d(e.value),a(!1)},className:`
                                w-full text-left px-4 py-2 text-sm 
                                flex items-center justify-between 
                                hover:bg-blue-50 transition-colors
                                ${s===e.value?"text-blue-600 font-medium bg-blue-50":"text-slate-700"}
                            `,children:[t.jsx("span",{children:e.label}),s===e.value&&t.jsx(h,{size:16,className:"text-blue-500"})]},e.value))})]})}export{v as M};
