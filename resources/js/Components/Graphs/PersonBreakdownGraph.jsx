import React, { useId, useMemo, useState } from "react";
import { SearchX, TrendingUp, X } from "lucide-react";
import GraphCard from "../ui/GraphCard";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

/**
 * Shared dashboard graph for the Casualties / Injured / Missing cards.
 * Horizontal bars (full labels, no rotated text) split by sex, with a second
 * view that breaks the same records down by age group.
 */

// Chart series colors (data colors, not UI tokens). Each is >=4.5:1 on white and
// the legend/values are always written out, so color is never the only signal.
const SERIES = {
    Male: { label: "Male", bar: "bg-blue-600", dot: "bg-blue-600" },
    Female: { label: "Female", bar: "bg-pink-600", dot: "bg-pink-600" },
};

const ACCENT_TEXT = {
    destructive: "text-destructive",
    warning: "text-warning",
    info: "text-info",
};

const AGE_BRACKETS = ["0-17", "18-30", "31-50", "51-65", "66+"];
const ROW_LIMIT = 8;

const ageBracket = (rawAge) => {
    const age = parseInt(rawAge, 10);
    if (Number.isNaN(age)) return "Not given";
    if (age <= 17) return "0-17";
    if (age <= 30) return "18-30";
    if (age <= 50) return "31-50";
    if (age <= 65) return "51-65";
    return "66+";
};

const sexOf = (item) => {
    const sex = item.sex?.toLowerCase();
    if (sex === "male") return "Male";
    if (sex === "female") return "Female";
    return null;
};

const describe = (row) => {
    const parts = [];
    if (row.Male) parts.push(`${row.Male} male`);
    if (row.Female) parts.push(`${row.Female} female`);
    const other = row.total - row.Male - row.Female;
    if (other) parts.push(`${other} not specified`);
    return parts.join(", ");
};

function SexLegend({ counts }) {
    return (
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {Object.entries(SERIES).map(([key, series]) => (
                <li key={key} className="flex items-center gap-1.5">
                    <span className={`h-2.5 w-2.5 rounded-sm ${series.dot}`} aria-hidden="true" />
                    {series.label}
                    <span className="font-semibold tabular-nums text-foreground">{counts[key]}</span>
                </li>
            ))}
        </ul>
    );
}

function BarRows({ rows, label }) {
    const max = Math.max(...rows.map((row) => row.total), 1);
    const width = (n) => `${(n / max) * 100}%`;

    return (
        <ul className="space-y-3" aria-label={label}>
            {rows.map((row) => (
                <li key={row.label}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="min-w-0 break-words font-medium text-foreground">{row.label}</span>
                        <span className="shrink-0 text-right tabular-nums text-muted-foreground">
                            <span className="font-semibold text-foreground">{row.total}</span>
                            {describe(row) && <span className="ml-1 hidden text-xs sm:inline">({describe(row)})</span>}
                        </span>
                    </div>
                    <div
                        className="mt-1 flex h-3 overflow-hidden rounded-full bg-muted"
                        role="img"
                        aria-label={`${row.label}: ${row.total} (${describe(row) || "no sex given"})`}
                    >
                        <div className={SERIES.Male.bar} style={{ width: width(row.Male) }} />
                        <div className={SERIES.Female.bar} style={{ width: width(row.Female) }} />
                        <div
                            className="bg-muted-foreground/50"
                            style={{ width: width(row.total - row.Male - row.Female) }}
                        />
                    </div>
                </li>
            ))}
        </ul>
    );
}

const PersonBreakdownGraph = React.memo(function PersonBreakdownGraph({
    title,
    icon: Icon,
    items = [],
    groupKey,
    groupLabel,
    unit,
    accent = "destructive",
}) {
    const uid = useId();
    const [view, setView] = useState("group");
    const [sex, setSex] = useState("all");
    const [age, setAge] = useState("all");
    const [showAll, setShowAll] = useState(false);

    const hasFilters = sex !== "all" || age !== "all";
    const clearFilters = () => {
        setSex("all");
        setAge("all");
    };

    const filtered = useMemo(
        () =>
            items.filter((item) => {
                if (sex !== "all" && sexOf(item) !== sex) return false;
                if (age !== "all" && ageBracket(item.age) !== age) return false;
                return true;
            }),
        [items, sex, age],
    );

    const counts = useMemo(() => {
        const result = { Male: 0, Female: 0 };
        filtered.forEach((item) => {
            const s = sexOf(item);
            if (s) result[s] += 1;
        });
        return result;
    }, [filtered]);

    const aggregate = (keyFn) => {
        const map = {};
        filtered.forEach((item) => {
            const key = keyFn(item);
            if (!map[key]) map[key] = { label: key, Male: 0, Female: 0, total: 0 };
            const s = sexOf(item);
            if (s) map[key][s] += 1;
            map[key].total += 1;
        });
        return Object.values(map);
    };

    const groupRows = useMemo(
        () =>
            aggregate((item) => item[groupKey]?.toString().trim() || "Not specified").sort(
                (a, b) => b.total - a.total || a.label.localeCompare(b.label),
            ),
        [filtered, groupKey],
    );

    const ageRows = useMemo(() => {
        const rows = aggregate((item) => ageBracket(item.age));
        const order = [...AGE_BRACKETS, "Not given"];
        return rows.sort((a, b) => order.indexOf(a.label) - order.indexOf(b.label));
    }, [filtered]);

    const visibleGroupRows = showAll ? groupRows : groupRows.slice(0, ROW_LIMIT);
    const rows = view === "group" ? visibleGroupRows : ageRows;

    const toggle = (
        <div className="flex rounded-lg bg-muted p-1" role="group" aria-label={`${title} view`}>
            {[
                { key: "group", label: groupLabel },
                { key: "age", label: "Age" },
            ].map((option) => (
                <button
                    key={option.key}
                    type="button"
                    aria-pressed={view === option.key}
                    onClick={() => setView(option.key)}
                    className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none ${
                        view === option.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );

    return (
        <GraphCard title={title} icon={Icon && <Icon size={24} />} actions={toggle}>
            {/* Summary */}
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
                <p className="flex items-baseline gap-2">
                    <span className={`text-3xl font-semibold tabular-nums ${ACCENT_TEXT[accent]}`}>{filtered.length}</span>
                    <span className="text-sm text-muted-foreground">
                        {unit}
                        {hasFilters && " (filtered)"}
                    </span>
                </p>
                <SexLegend counts={counts} />
            </div>

            {/* Filters */}
            <div className="mt-4 flex flex-wrap items-end gap-3">
                <div>
                    <Label className="text-xs text-muted-foreground" htmlFor={`${uid}-sex`}>Sex</Label>
                    <Select value={sex} onValueChange={setSex}>
                        <SelectTrigger id={`${uid}-sex`} className="mt-1 h-9 w-28 bg-card">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label className="text-xs text-muted-foreground" htmlFor={`${uid}-age`}>Age group</Label>
                    <Select value={age} onValueChange={setAge}>
                        <SelectTrigger id={`${uid}-age`} className="mt-1 h-9 w-32 bg-card">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All ages</SelectItem>
                            {AGE_BRACKETS.map((bracket) => (
                                <SelectItem key={bracket} value={bracket}>
                                    {bracket}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {hasFilters && (
                    <Button type="button" variant="ghost" size="sm" onClick={clearFilters} className="h-9 gap-1">
                        <X className="h-4 w-4" aria-hidden="true" />
                        Clear
                    </Button>
                )}
            </div>

            {/* Chart */}
            <div className="mt-5 border-t pt-5">
                {rows.length > 0 ? (
                    <>
                        <p className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                            {view === "group" ? `By ${groupLabel.toLowerCase()}` : "By age group"}
                        </p>
                        <BarRows rows={rows} label={view === "group" ? `By ${groupLabel}` : "By age group"} />
                        {view === "group" && groupRows.length > ROW_LIMIT && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="mt-3 h-9 px-2 text-muted-foreground"
                                onClick={() => setShowAll((value) => !value)}
                            >
                                {showAll ? `Show top ${ROW_LIMIT}` : `Show all ${groupRows.length}`}
                            </Button>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center py-8 text-center text-muted-foreground">
                        {Icon && !hasFilters ? (
                            <Icon size={40} className="mb-3 opacity-60" aria-hidden="true" />
                        ) : (
                            <SearchX size={40} className="mb-3 opacity-60" aria-hidden="true" />
                        )}
                        <p className="text-sm font-medium text-foreground">
                            {items.length === 0 ? `No ${unit} reported yet` : "No records match these filters"}
                        </p>
                        {hasFilters && (
                            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={clearFilters}>
                                Clear filters
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </GraphCard>
    );
});

export default PersonBreakdownGraph;
