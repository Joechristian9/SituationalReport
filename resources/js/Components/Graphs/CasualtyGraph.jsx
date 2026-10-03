import React from "react";
import { UserX } from "lucide-react";
import PersonBreakdownGraph from "./PersonBreakdownGraph";

const CasualtyGraph = React.memo(({ casualties = [] }) => (
    <PersonBreakdownGraph
        title="Casualties"
        icon={UserX}
        items={casualties}
        groupKey="cause_of_death"
        groupLabel="Cause of death"
        unit="casualties"
        accent="destructive"
    />
));

CasualtyGraph.displayName = "CasualtyGraph";

export default CasualtyGraph;
