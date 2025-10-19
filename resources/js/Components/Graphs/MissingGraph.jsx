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
    UserSearch, // Changed from UserPlus to a more fitting icon
} from "lucide-react";

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
// Main Enhanced MissingGraph Component
// =================================================================================
const MissingGraph = ({ missingList = [] }) => {
    const [selectedSex, setSelectedSex] = useState("All");
    const [selectedAgeGroup, setSelectedAgeGroup] = useState("All");
    const [currentView, setCurrentView] = useState("bar");

    const ageBrackets = ["All", "0-17", "18-30", "31-50", "51-65", "66+"];

    const filteredCauseData = useMemo(() => {
        if (!Array.isArray(missingList)) return [];
        const data = missingList
            .filter(
                (missing) =>
                    selectedSex === "All" ||
                    missing.sex?.toLowerCase() === selectedSex.toLowerCase()
            )
            .filter((missing) => {
                if (selectedAgeGroup === "All") return true;
                const age = parseInt(missing.age, 10);
                if (isNaN(age)) return false;
                switch (selectedAgeGroup) {
                    case "0-17":
                        return age <= 17;
                    case "18-30":
                        return age >= 18 && age <= 30;
                    case "31-50":
                        return age >= 31 && age <= 50;
                    case "51-65":
                        return age >= 51 && age <= 65;
                    case "66+":
                        return age >= 66;
                    default:
                        return true;
                }
            })
            .reduce((acc, missing) => {
                const cause = missing.cause?.trim() || "Unknown";
                if (!acc[cause]) {
                    acc[cause] = { cause, count: 0 };
                }
                acc[cause].count += 1;
                return acc;
            }, {});
        return Object.values(data).sort((a, b) => a.count - b.count);
    }, [missingList, selectedSex, selectedAgeGroup]);

    const sexDistributionData = useMemo(() => {
        const filteredByAge = missingList.filter((missing) => {
            if (selectedAgeGroup === "All") return true;
            const age = parseInt(missing.age, 10);
            if (isNaN(age)) return false;
            switch (selectedAgeGroup) {
                case "0-17":
                    return age <= 17;
                case "18-30":
                    return age >= 18 && age <= 30;
                case "31-50":
                    return age >= 31 && age <= 50;
                case "51-65":
                    return age >= 51 && age <= 65;
                case "66+":
                    return age >= 66;
                default:
                    return true;
            }
        });

        const sexAggregator = filteredByAge.reduce(
            (acc, missing) => {
                const sex = missing.sex;
                if (sex?.toLowerCase() === "male") {
                    acc.Male.value += 1;
                } else if (sex?.toLowerCase() === "female") {
                    acc.Female.value += 1;
                }
                return acc;
            },
            {
                Male: { name: "Male", value: 0 },
                Female: { name: "Female", value: 0 },
            }
        );

        return Object.values(sexAggregator).filter((s) => s.value > 0);
    }, [missingList, selectedAgeGroup]);

    return (
        <div className="w-full bg-white rounded-2xl shadow p-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">
                        {currentView === "bar"
                            ? "Missing Persons by Cause"
                            : "Missing Persons by Sex"}
                    </h2>
                    <p className="text-sm text-gray-500">
                        {currentView === "bar"
                            ? `Showing: ${selectedSex} / Age Group: ${selectedAgeGroup}`
                            : `Showing Age Group: ${selectedAgeGroup}`}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() =>
                            setCurrentView(
                                currentView === "bar" ? "pie" : "bar"
                            )
                        }
                        className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors relative group"
                    >
                        {currentView === "bar" ? (
                            <PieChartIcon size={20} />
                        ) : (
                            <BarChart2 size={20} />
                        )}
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {currentView === "bar"
                                ? "Switch to Pie Chart"
                                : "Switch to Bar Chart"}
                        </div>
                    </button>

                    {currentView === "bar" && (
                        <SexFilterPopover
                            selectedSex={selectedSex}
                            onSelect={setSelectedSex}
                        />
                    )}

                    <div className="h-6 w-px bg-gray-200 mx-2"></div>

                    <AgeFilterDropdown
                        options={ageBrackets}
                        selectedOption={selectedAgeGroup}
                        onSelect={setSelectedAgeGroup}
                    />
                </div>
            </div>

            <div className="mt-6">
                <ResponsiveContainer width="100%" height={400}>
                    {currentView === "bar" ? (
                        filteredCauseData.length > 0 ? (
                            <BarChart
                                layout="vertical"
                                data={filteredCauseData}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    horizontal={false}
                                />
                                <XAxis type="number" allowDecimals={false} />
                                <YAxis
                                    type="category"
                                    dataKey="cause"
                                    width={150}
                                    tick={{ fontSize: 12 }}
                                />
                                <Tooltip
                                    content={<CustomTooltip />}
                                    cursor={{
                                        fill: "rgba(96, 165, 250, 0.2)",
                                    }}
                                />
                                <Bar
                                    dataKey="count"
                                    name="Missing"
                                    fill="#3B82F6"
                                    radius={[0, 4, 4, 0]}
                                />
                            </BarChart>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                                <UserSearch // Changed Icon
                                    size={40}
                                    className="text-gray-400"
                                />
                                <p className="mt-4 font-semibold text-gray-700">
                                    No Data for Selected Filters
                                </p>
                                <p className="text-sm text-gray-500">
                                    {missingList.length === 0
                                        ? "No missing persons recorded."
                                        : "Try adjusting filters."}
                                </p>
                            </div>
                        )
                    ) : sexDistributionData.length > 0 ? (
                        <PieChart>
                            <Pie
                                data={sexDistributionData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={150}
                                paddingAngle={5}
                                label={renderCustomizedLabel}
                                labelLine={false}
                            >
                                {sexDistributionData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={
                                            SEX_COLORS[
                                                index % SEX_COLORS.length
                                            ]
                                        }
                                    />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                        </PieChart>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                            <PieChartIcon size={40} className="text-gray-400" />
                            <p className="mt-4 font-semibold text-gray-700">
                                No Gender Data for Selected Age Group
                            </p>
                        </div>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default MissingGraph;
