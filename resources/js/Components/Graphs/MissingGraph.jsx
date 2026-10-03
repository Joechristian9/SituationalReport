import React from "react";
import { UserSearch } from "lucide-react";
import PersonBreakdownGraph from "./PersonBreakdownGraph";

const MissingGraph = React.memo(({ missingList = [], sex, age }) => (
    <PersonBreakdownGraph
        title="Missing Persons"
        icon={UserSearch}
        items={missingList}
        sex={sex}
        age={age}
        groupTab="Cause"
        groupKey="cause"
        groupLabel="Cause"
        unit="missing"
        accent="info"
        seriesColor="var(--viz-missing)"
    />
));

MissingGraph.displayName = "MissingGraph";

export default MissingGraph;
