import React from "react";
import { UserSearch } from "lucide-react";
import PersonBreakdownGraph from "./PersonBreakdownGraph";

const MissingGraph = React.memo(({ missingList = [] }) => (
    <PersonBreakdownGraph
        title="Missing Persons"
        icon={UserSearch}
        items={missingList}
        groupKey="cause"
        groupLabel="Cause"
        unit="missing"
        accent="info"
    />
));

MissingGraph.displayName = "MissingGraph";

export default MissingGraph;
