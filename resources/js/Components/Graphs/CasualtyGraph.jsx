import React from "react";
import { UserX } from "lucide-react";
import PersonBreakdownGraph from "./PersonBreakdownGraph";

const CasualtyGraph = React.memo(({ casualties = [], sex, age }) => (
    <PersonBreakdownGraph
        title="Casualties"
        icon={UserX}
        items={casualties}
        sex={sex}
        age={age}
        groupTab="Cause"
        groupKey="cause_of_death"
        groupLabel="Cause of death"
        unit="casualties"
        accent="destructive"
        seriesColor="var(--viz-dead)"
    />
));

CasualtyGraph.displayName = "CasualtyGraph";

export default CasualtyGraph;
