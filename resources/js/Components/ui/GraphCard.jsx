import React from "react";

const GraphCard = ({ title, icon, actions, children }) => (
    <div className="bg-white shadow-lg rounded-2xl p-4 sm:p-6 h-full min-w-0 flex flex-col transition-all duration-300 hover:shadow-xl">
        {/* Card Header: title stays on one line; actions wrap below it when space runs out */}
        <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
            <div className="flex items-center gap-3 shrink-0">
                {icon && (
                    <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                        {icon}
                    </div>
                )}
                <h3 className="text-lg font-bold text-gray-800 whitespace-nowrap">{title}</h3>
            </div>
            {actions && <div className="w-full sm:w-auto sm:ml-auto min-w-0">{actions}</div>}
        </div>
        {/* Card Body */}
        <div className="flex-grow w-full h-full min-w-0">{children}</div>
    </div>
);

export default GraphCard;
