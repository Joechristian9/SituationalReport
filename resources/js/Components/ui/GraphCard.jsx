import React from "react";
import { cn } from "@/lib/utils";

const GraphCard = ({ title, icon, actions, headerClassName, actionsClassName, children }) => (
    <div className="flex h-full min-w-0 flex-col rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
        {/* Card Header: title stays on one line; actions wrap below it when space runs out */}
        <div className={cn("mb-4 flex flex-wrap items-center justify-between gap-3", headerClassName)}>
            <div className="flex shrink-0 items-center gap-3">
                {icon && (
                    <div className="rounded-lg bg-primary/10 p-2 text-primary ring-1 ring-inset ring-primary/15">
                        {icon}
                    </div>
                )}
                <h3 className="whitespace-nowrap text-lg font-semibold text-foreground">{title}</h3>
            </div>
            {actions && <div className={cn("w-full min-w-0 sm:ml-auto sm:w-auto", actionsClassName)}>{actions}</div>}
        </div>
        {/* Card Body */}
        <div className="h-full w-full min-w-0 flex-grow">{children}</div>
    </div>
);

export default GraphCard;
