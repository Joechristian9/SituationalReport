import React from "react";
import { UserPlus } from "lucide-react";
import PersonBreakdownGraph from "./PersonBreakdownGraph";

const InjuredGraph = React.memo(({ injuredList = [] }) => (
    <PersonBreakdownGraph
        title="Injured Persons"
        icon={UserPlus}
        items={injuredList}
        groupKey="diagnosis"
        groupLabel="Diagnosis"
        unit="injured"
        accent="warning"
    />
));

InjuredGraph.displayName = "InjuredGraph";

export default InjuredGraph;
