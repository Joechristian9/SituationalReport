import React from "react";

const GraphCard = ({ title, icon, actions, children }) => (
    <div className="bg-white shadow-lg rounded-2xl p-4 sm:p-6 h-full flex flex-col transition-all duration-300 hover:shadow-xl">
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
            <div className="flex items-center gap-3">
                {icon && (
                    <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                        {icon}
                    </div>
                )}
                <h3 className="text-lg font-bold text-gray-800">{title}</h3>
            </div>
            {actions && <div className="w-full sm:w-auto">{actions}</div>}
        </div>
        {/* Card Body */}
        <div className="flex-grow w-full h-full">{children}</div>
    </div>
);

export default GraphCard;
