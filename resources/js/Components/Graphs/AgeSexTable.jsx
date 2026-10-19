import React, { useMemo } from "react";
import { Table2 } from "lucide-react";
import GraphCard from "../ui/GraphCard";
import { cn } from "@/lib/utils";
import { AGE_BRACKETS, ageBracket, sexOf } from "./personStats";
import { Swatch } from "./chartParts";

const TYPES = [
    { key: "dead", label: "Dead", color: "var(--viz-dead)" },
    { key: "injured", label: "Injured", color: "var(--viz-injured)" },
    { key: "missing", label: "Missing", color: "var(--viz-missing)" },
];
const SEXES = [
    { key: "Male", short: "M", label: "Male" },
    { key: "Female", short: "F", label: "Female" },
    { key: "Unknown", short: "N/S", label: "Sex not specified" },
];
const NO_AGE = "Age not given";

/** Counts per age bracket and sex for one list: { "0-17": { Male, Female, Unknown }, ... }. */
function countByAgeAndSex(items) {
    const rows = Object.fromEntries([...AGE_BRACKETS, NO_AGE].map((age) => [age, { Male: 0, Female: 0, Unknown: 0 }]));
    items.forEach((item) => (rows[ageBracket(item.age) ?? NO_AGE][sexOf(item)] += 1));
    return rows;
}

const cell = "px-2.5 py-2 text-right tabular-nums";
// The age column stays put while the table scrolls sideways on phones.
const stickyCell = "sticky left-0 z-10 bg-card py-2 pl-4 pr-3 text-left sm:pl-6";

/**
 * Sex- and age-disaggregated counts of Dead / Injured / Missing side by side, the breakdown
 * disaster reports ask for. Always the whole disaster: the panel filters don't apply here.
 */
export default function AgeSexTable({ casualties = [], injured = [], missing = [] }) {
    const counts = useMemo(
        () => ({ dead: countByAgeAndSex(casualties), injured: countByAgeAndSex(injured), missing: countByAgeAndSex(missing) }),
        [casualties, injured, missing],
    );

    const ages = [...AGE_BRACKETS, NO_AGE].filter(
        (age) => age !== NO_AGE || TYPES.some((t) => SEXES.some((s) => counts[t.key][NO_AGE][s.key] > 0)),
    );
    const rowCells = (age) => TYPES.flatMap((t) => SEXES.map((s) => counts[t.key][age][s.key]));
    const totals = TYPES.flatMap((t) => SEXES.map((s) => ages.reduce((sum, age) => sum + counts[t.key][age][s.key], 0)));
    const sum = (values) => values.reduce((a, b) => a + b, 0);
    const groupStart = (i) => i % SEXES.length === 0 && "border-l border-border";

    return (
        <GraphCard title="Age & sex by type" icon={<Table2 size={24} />}>
            <p className="-mt-2 mb-3 text-sm text-muted-foreground">Every report for this disaster; the filters above don't apply.</p>
            <div className="-mx-4 overflow-x-auto sm:-mx-6" tabIndex={0} role="region" aria-label="Age and sex by type, scrolls sideways">
                <table className="w-full min-w-[40rem] text-sm">
                    <caption className="sr-only">Dead, injured and missing by age group and sex</caption>
                    <thead className="text-xs text-muted-foreground">
                        <tr>
                            <td className={stickyCell} />
                            {TYPES.map((t) => (
                                <th key={t.key} scope="colgroup" colSpan={SEXES.length} className="border-l border-border px-2.5 pt-1 text-center text-sm font-semibold text-foreground">
                                    <span className="inline-flex items-center gap-1.5">
                                        <Swatch color={t.color} />
                                        {t.label}
                                    </span>
                                </th>
                            ))}
                            <td className={cell} />
                        </tr>
                        <tr className="border-b border-border">
                            <th scope="col" className={cn(stickyCell, "font-medium")}>Age group</th>
                            {TYPES.flatMap((t) =>
                                SEXES.map((s, i) => (
                                    <th key={`${t.key}-${s.key}`} scope="col" className={cn(cell, "font-medium", i === 0 && "border-l border-border")}>
                                        <abbr title={s.label} className="no-underline">{s.short}</abbr>
                                    </th>
                                )),
                            )}
                            <th scope="col" className={cn(cell, "pr-4 font-medium sm:pr-6")}>Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {ages.map((age) => {
                            const values = rowCells(age);
                            return (
                                <tr key={age} className="hover:bg-muted/40">
                                    <th scope="row" className={cn(stickyCell, "font-medium text-foreground")}>{age}</th>
                                    {values.map((value, i) => (
                                        <td key={i} className={cn(cell, groupStart(i), value === 0 && "text-muted-foreground")}>
                                            {value}
                                        </td>
                                    ))}
                                    <td className={cn(cell, "pr-4 font-semibold sm:pr-6")}>{sum(values)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2 border-border font-semibold">
                            <th scope="row" className={stickyCell}>Total</th>
                            {totals.map((value, i) => (
                                <td key={i} className={cn(cell, groupStart(i))}>{value}</td>
                            ))}
                            <td className={cn(cell, "pr-4 sm:pr-6")}>{sum(totals)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </GraphCard>
    );
}
