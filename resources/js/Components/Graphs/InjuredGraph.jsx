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
    X,
    TrendingUp,
} from "lucide-react";
import GraphCard from "../ui/GraphCard";

// =================================================================================
// Reusable Sub-Components for the Enhanced UI
// =================================================================================

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const total = payload.reduce((sum, entry) => sum + (entry.value || 0), 0);
        
        return (
            <div className="p-3 bg-white rounded-lg shadow-lg border border-gray-200">
                <p className="font-bold text-gray-800 mb-2">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <span
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: entry.fill || entry.color }}
                            ></span>
                            <span className="text-gray-700">{entry.name}:</span>
                        </div>
                        <span className="font-semibold" style={{ color: entry.fill || entry.color }}>
                            {entry.value.toLocaleString()}
                        </span>
                    </div>
                ))}
                <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between text-sm font-bold">
                    <span>Total:</span>
                    <span className="text-gray-800">{total.toLocaleString()}</span>
                </div>
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
const InjuredGraph = React.memo(({ injuredList = [] }) => {
    const [windowWidth, setWindowWidth] = useState(
        typeof window !== 'undefined' ? window.innerWidth : 1024
    );
    
    useEffect(() => {
        let timeoutId;
        const handleResize = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                setWindowWidth(window.innerWidth);
            }, 150);
        };
        window.addEventListener('resize', handleResize);
        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);
    
    const isMobile = windowWidth < 640;
    const isTablet = windowWidth >= 640 && windowWidth < 1024;
    const [selectedSex, setSelectedSex] = useState("All");
    const [selectedAgeGroup, setSelectedAgeGroup] = useState("All");
    const [currentView, setCurrentView] = useState("stacked");
    const ageBrackets = ["All", "0-17", "18-30", "31-50", "51-65", "66+"];
    
    const clearFilters = () => {
        setSelectedSex("All");
        setSelectedAgeGroup("All");
    };
    
    const hasActiveFilters = selectedSex !== "All" || selectedAgeGroup !== "All";

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

    const stackedData = useMemo(() => {
        const aggregator = filteredData.reduce((acc, item) => {
            const diagnosis = item.diagnosis?.trim() || "Unknown";
            const sex = item.sex?.toLowerCase();
            
            if (!acc[diagnosis]) {
                acc[diagnosis] = { diagnosis, Male: 0, Female: 0, total: 0 };
            }
            
            if (sex === "male") acc[diagnosis].Male += 1;
            else if (sex === "female") acc[diagnosis].Female += 1;
            acc[diagnosis].total += 1;
            
            return acc;
        }, {});
        
        return Object.values(aggregator)
            .sort((a, b) => b.total - a.total)
            .slice(0, 8);
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
        <div className="flex items-center justify-end gap-2">
            <button
                onClick={() =>
                    setCurrentView(currentView === "stacked" ? "pie" : "stacked")
                }
                className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors group relative"
            >
                {currentView === "stacked" ? (
                    <PieChartIcon size={20} />
                ) : (
                    <BarChart2 size={20} />
                )}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {currentView === "stacked" ? "Distribution" : "Top Diagnoses"}
                </div>
            </button>
            {currentView === "stacked" && (
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

    const filterBadges = (
        <div className="flex flex-wrap gap-2 mb-3">
            {hasActiveFilters && (
                <>
                    {selectedSex !== "All" && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                            Sex: {selectedSex}
                            <button onClick={() => setSelectedSex("All")} className="hover:bg-blue-200 rounded-full p-0.5">
                                <X size={12} />
                            </button>
                        </span>
                    )}
                    {selectedAgeGroup !== "All" && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                            Age: {selectedAgeGroup}
                            <button onClick={() => setSelectedAgeGroup("All")} className="hover:bg-purple-200 rounded-full p-0.5">
                                <X size={12} />
                            </button>
                        </span>
                    )}
                    <button
                        onClick={clearFilters}
                        className="text-xs text-gray-500 hover:text-gray-700 underline"
                    >
                        Clear all
                    </button>
                </>
            )}
        </div>
    );

    return (
        <GraphCard
            title="Injured Persons"
            icon={<UserPlus size={24} />}
            actions={graphActions}
        >
            {filterBadges}
            <div className="text-xs text-gray-600 mb-3 flex items-center gap-2">
                <TrendingUp size={14} />
                <span>Total: <strong className="text-amber-600">{filteredData.length}</strong> injured</span>
            </div>
            <ResponsiveContainer width="100%" height={isMobile ? 250 : isTablet ? 280 : 300}>
                {currentView === "stacked" ? (
                    stackedData.length > 0 ? (
                        <BarChart
                            data={stackedData}
                            margin={{ 
                                top: 5, 
                                right: isMobile ? 10 : 20, 
                                left: isMobile ? -10 : 10, 
                                bottom: isMobile ? 50 : 40 
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="diagnosis"
                                angle={isMobile ? -60 : -45}
                                textAnchor="end"
                                height={isMobile ? 90 : 80}
                                tick={{ fontSize: isMobile ? 8 : 10 }}
                            />
                            <YAxis
                                allowDecimals={false}
                                tick={{ fontSize: isMobile ? 10 : 11 }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Bar
                                dataKey="Male"
                                stackId="a"
                                fill="#3B82F6"
                                radius={[4, 4, 0, 0]}
                            />
                            <Bar
                                dataKey="Female"
                                stackId="a"
                                fill="#EC4899"
                                radius={[4, 4, 0, 0]}
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
                    <div className="h-full flex items-center justify-center">
                        <PieChart width={280} height={280}>
                            <Pie
                                data={sexData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={110}
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
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </div>
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
});

InjuredGraph.displayName = 'InjuredGraph';

export default InjuredGraph;
