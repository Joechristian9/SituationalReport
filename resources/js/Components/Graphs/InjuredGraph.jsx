import React from "react";
import { UserPlus } from "lucide-react";
import PersonBreakdownGraph from "./PersonBreakdownGraph";

const InjuredGraph = React.memo(({ injuredList = [], sex, age }) => (
    <PersonBreakdownGraph
        title="Injured Persons"
        icon={UserPlus}
        items={injuredList}
        sex={sex}
        age={age}
        groupTab="Diagnosis"
        groupKey="diagnosis"
        groupLabel="Diagnosis"
        unit="injured"
        accent="warning"
        seriesColor="var(--viz-injured)"
    />
));

InjuredGraph.displayName = "InjuredGraph";

export default InjuredGraph;
