import React from "react";
import { X } from "lucide-react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { AGE_BRACKETS } from "./personStats";

/** One filter row that scopes all three Human Impact graphs. */
export default function ImpactFilters({ sex, age, onSexChange, onAgeChange }) {
    const active = sex !== "all" || age !== "all";

    return (
        <div className="flex flex-wrap items-end gap-3">
            <div>
                <Label htmlFor="impact-sex" className="text-xs text-muted-foreground">Sex</Label>
                <Select value={sex} onValueChange={onSexChange}>
                    <SelectTrigger id="impact-sex" className="mt-1 h-10 w-32 bg-card md:h-9">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Unknown">Not specified</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div>
                <Label htmlFor="impact-age" className="text-xs text-muted-foreground">Age group</Label>
                <Select value={age} onValueChange={onAgeChange}>
                    <SelectTrigger id="impact-age" className="mt-1 h-10 w-32 bg-card md:h-9">
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
            {active && (
                <Button
                    type="button"
                    variant="ghost"
                    className="h-10 gap-1 md:h-9"
                    onClick={() => {
                        onSexChange("all");
                        onAgeChange("all");
                    }}
                >
                    <X className="h-4 w-4" aria-hidden="true" />
                    Clear filters
                </Button>
            )}
            <p className="pb-2 text-xs text-muted-foreground">Applies to the three graphs below.</p>
        </div>
    );
}
