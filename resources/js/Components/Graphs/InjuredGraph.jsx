import React, { useState, useMemo, useRef, useEffect } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import {
    CalendarDays,
    Check,
    BarChart2,
    PieChart as PieChartIcon,
    User,
    UserRound,
    CircleUserRound,
    UserPlus,
} from "lucide-react";
import GraphCard from "../ui/GraphCard";

// =================================================================================
// Reusable Sub-Components for the Enhanced UI
// =================================================================================

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const value = payload[0].value;
        const name = payload[0].name;
        const color = payload[0].payload.fill || payload[0].fill;
        return (
            <div className="p-3 bg-white rounded-lg shadow-lg border border-gray-200">
                <p className="font-bold text-gray-800">{label}</p>
                <p style={{ color: color }}>
                    {`${name}: ${value.toLocaleString()}`}
                </p>
            </div>
        );
    }
    return null;
};

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
}) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
        <text
            x={x}
            y={y}
            fill="white"
            textAnchor={x > cx ? "start" : "end"}
            dominantBaseline="central"
        >
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};
const SEX_COLORS = ["#3B82F6", "#EC4899"];

const SexFilterPopover = ({ selectedSex, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                popoverRef.current &&
                !popoverRef.current.contains(event.target)
            )
                setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    const options = [
        {
            value: "All",
            icon: CircleUserRound,
            tooltip: "All Genders",
            color: "text-gray-500",
        },
        { value: "Male", icon: User, tooltip: "Male", color: "text-blue-500" },
        {
            value: "Female",
            icon: UserRound,
            tooltip: "Female",
            color: "text-pink-500",
        },
    ];
    const currentOption = options.find((opt) => opt.value === selectedSex);
    const CurrentIcon = currentOption?.icon;
    const currentIconColor = currentOption?.color;
    return (
        <div className="relative" ref={popoverRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors relative group"
            >
                {CurrentIcon && (
                    <CurrentIcon size={20} className={currentIconColor} />
                )}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity">{`Sex: ${selectedSex}`}</div>
            </button>
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 p-1 bg-white border border-gray-200 rounded-lg shadow-xl z-10 flex items-center gap-1">
                    {options.map(({ value, icon: Icon, tooltip, color }) => (
                        <div key={value} className="relative group">
                            <button
                                onClick={() => {
                                    onSelect(value);
                                    setIsOpen(false);
                                }}
                                className={`p-2 rounded-md transition-colors ${
                                    selectedSex === value
                                        ? "bg-indigo-100"
                                        : "hover:bg-gray-100"
                                }`}
                            >
                                <Icon size={20} className={color} />
                            </button>
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                                {tooltip}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const AgeFilterDropdown = ({ options, selectedOption, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            )
                setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    const handleSelect = (value) => {
        onSelect(value);
        setIsOpen(false);
    };
    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors relative group"
            >
                <CalendarDays size={20} />
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{`Age Group: ${selectedOption}`}</div>
            </button>
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-10">
                    {options.map((option) => (
                        <button
                            key={option}
                            onClick={() => handleSelect(option)}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 flex items-center justify-between"
                        >
                            {option}
                            {selectedOption === option && (
                                <Check className="h-4 w-4 text-indigo-600" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// =================================================================================
// Main Enhanced InjuredGraph Component
// =================================================================================
const InjuredGraph = ({ injuredList = [] }) => {
    const [selectedSex, setSelectedSex] = useState("All");
    const [selectedAgeGroup, setSelectedAgeGroup] = useState("All");
    const [currentView, setCurrentView] = useState("bar");
    const ageBrackets = ["All", "0-17", "18-30", "31-50", "51-65", "66+"];

    const filteredData = useMemo(() => {
        return injuredList
            .filter(
                (item) =>
                    selectedSex === "All" ||
                    item.sex?.toLowerCase() === selectedSex.toLowerCase()
            )
            .filter((item) => {
                if (selectedAgeGroup === "All") return true;
                const age = parseInt(item.age, 10);
                if (isNaN(age)) return false;
                const [min, max] = selectedAgeGroup.split("-").map(Number);
                if (max) return age >= min && age <= max;
                return age >= 66; // For "66+"
            });
    }, [injuredList, selectedSex, selectedAgeGroup]);

    const diagnosisData = useMemo(() => {
        const aggregator = filteredData.reduce((acc, item) => {
            const diagnosis = item.diagnosis?.trim() || "Unknown";
            acc[diagnosis] = (acc[diagnosis] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(aggregator)
            .map(([diagnosis, count]) => ({ diagnosis, count }))
            .sort((a, b) => a.count - b.count);
    }, [filteredData]);

    const sexData = useMemo(() => {
        const aggregator = filteredData.reduce(
            (acc, item) => {
                const sex = item.sex?.toLowerCase();
                if (sex === "male") acc.Male.value += 1;
                else if (sex === "female") acc.Female.value += 1;
                return acc;
            },
            {
                Male: { name: "Male", value: 0 },
                Female: { name: "Female", value: 0 },
            }
        );
        return Object.values(aggregator).filter((s) => s.value > 0);
    }, [filteredData]);

    const graphActions = (
        <div className="flex items-center justify-start sm:justify-end gap-2 flex-wrap">
            <button
                onClick={() =>
                    setCurrentView(currentView === "bar" ? "pie" : "bar")
                }
                className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors group relative"
            >
                {currentView === "bar" ? (
                    <PieChartIcon size={20} />
                ) : (
                    <BarChart2 size={20} />
                )}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {currentView === "bar"
                        ? "View by Sex"
                        : "View by Diagnosis"}
                </div>
            </button>
            {currentView === "bar" && (
                <SexFilterPopover
                    selectedSex={selectedSex}
                    onSelect={setSelectedSex}
                />
            )}
            <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block"></div>
            <AgeFilterDropdown
                options={ageBrackets}
                selectedOption={selectedAgeGroup}
                onSelect={setSelectedAgeGroup}
            />
        </div>
    );

    const subtitle =
        currentView === "bar"
            ? `By Diagnosis | Sex: ${selectedSex} | Age: ${selectedAgeGroup}`
            : `By Sex | Age: ${selectedAgeGroup}`;

    return (
        <GraphCard
            title="Injured Persons"
            icon={<UserPlus size={24} />}
            actions={graphActions}
        >
            <p className="text-xs text-gray-500 -mt-3 mb-3">{subtitle}</p>
            <ResponsiveContainer width="100%" height={300}>
                {currentView === "bar" ? (
                    diagnosisData.length > 0 ? (
                        <BarChart
                            layout="vertical"
                            data={diagnosisData}
                            margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                horizontal={false}
                            />
                            <XAxis
                                type="number"
                                allowDecimals={false}
                                tick={{ fontSize: 12 }}
                            />
                            <YAxis
                                type="category"
                                dataKey="diagnosis"
                                width={100}
                                tick={{ fontSize: 11 }}
                            />
                            <Tooltip
                                content={<CustomTooltip />}
                                cursor={{ fill: "rgba(245, 158, 11, 0.1)" }}
                            />
                            <Bar
                                dataKey="count"
                                name="Injured"
                                fill="#F59E0B"
                                radius={[0, 4, 4, 0]}
                                maxBarSize={30}
                            />
                        </BarChart>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <UserPlus
                                size={48}
                                className="mb-4 text-gray-400"
                            />
                            <p className="font-semibold">
                                {injuredList.length === 0
                                    ? "No Injured Persons Data"
                                    : "No data for selected filters"}
                            </p>
                        </div>
                    )
                ) : sexData.length > 0 ? (
                    <PieChart>
                        <Pie
                            data={sexData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            labelLine={false}
                            label={renderCustomizedLabel}
                        >
                            {sexData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={SEX_COLORS[index % SEX_COLORS.length]}
                                />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                    </PieChart>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <PieChartIcon
                            size={48}
                            className="mb-4 text-gray-400"
                        />
                        <p className="font-semibold">
                            No gender data for this filter
                        </p>
                    </div>
                )}
            </ResponsiveContainer>
        </GraphCard>
    );
};

export default InjuredGraph;
