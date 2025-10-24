import React, { useState, useEffect } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import {
    Sun,
    Sunset,
    Wind,
    Droplets,
    Gauge,
    Eye,
    Thermometer,
    Loader2,
} from "lucide-react";
import { getWeatherInfo, formatTime } from "./weatherUtils.jsx";

const WeatherDashboard = () => {
    const [weatherData, setWeatherData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);

    useEffect(() => {
        const fetchWeather = async () => {
            // --- 1. UPDATE THE COORDINATES HERE ---
            const lat = 17.15; // Ilagan Latitude
            const lon = 121.89; // Ilagan Longitude
            const timezone = "Asia/Manila";
            const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,visibility,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=${timezone}`;

            try {
                const response = await fetch(apiUrl);
                if (!response.ok)
                    throw new Error("Failed to fetch weather data.");
                const data = await response.json();
                setWeatherData(data);
                setLastUpdated(new Date());
            } catch (error) {
                console.error("Weather fetch error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchWeather();
        const intervalId = setInterval(fetchWeather, 900000); // Refresh every 15 minutes
        return () => clearInterval(intervalId); // Cleanup interval on component unmount
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-6 bg-white rounded-lg min-h-[300px]">
                <Loader2 className="animate-spin mr-2" /> Loading weather
                dashboard...
            </div>
        );
    }

    if (!weatherData) {
        return (
            <div className="p-6 text-center text-red-500 bg-white rounded-lg">
                Could not load weather data.
            </div>
        );
    }

    const { current, daily, hourly } = weatherData;
    const todayIndex = 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 font-sans">
            <div className="md:col-span-3 lg:col-span-2 p-6 bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg flex flex-col justify-between">
                <CurrentWeatherBlock
                    current={current}
                    daily={daily}
                    lastUpdated={lastUpdated}
                />
                <HourlyForecastChart hourly={hourly} />
            </div>
            <div className="md:col-span-3 lg:col-span-2 grid grid-cols-2 gap-4">
                <InfoCard
                    icon={<Eye size={20} />}
                    title="Visibility"
                    value={`${(current.visibility / 1000).toFixed(1)} km`}
                    description="Excellent"
                />
                <InfoCard
                    icon={<Droplets size={20} />}
                    title="Humidity"
                    value={`${current.relative_humidity_2m}%`}
                    description="Extremely Humid"
                />
                <WindCard current={current} />
                <SunHoursCard daily={daily} index={todayIndex} />
                <InfoCard
                    icon={<Gauge size={20} />}
                    title="Pressure"
                    value={`${Math.round(current.pressure_msl)} mb`}
                    description="Rising slowly"
                />
                <InfoCard
                    icon={<Thermometer size={20} />}
                    title="Feels Like"
                    value={`${Math.round(current.apparent_temperature)}°`}
                    description="Similar to actual"
                />
            </div>
        </div>
    );
};

const CurrentWeatherBlock = ({ current, daily, lastUpdated }) => {
    const { icon, description } = getWeatherInfo(current.weather_code);
    const todayIndex = 0;

    return (
        <div>
            <div className="flex justify-between items-start">
                <div>
                    {/* --- 2. UPDATE THE DISPLAYED LOCATION NAME HERE --- */}
                    <h2 className="text-xl font-bold text-gray-800">
                        Ilagan, Cagayan Valley
                    </h2>
                    <p className="text-sm text-gray-500">
                        {lastUpdated
                            ? `Updated at ${formatTime(lastUpdated)}`
                            : "..."}
                    </p>
                </div>
                <div className="text-4xl text-gray-700">{icon}</div>
            </div>
            <div className="flex items-center gap-4 mt-2">
                <p className="text-7xl font-bold text-gray-900">
                    {Math.round(current.temperature_2m)}°C
                </p>
                <div>
                    <p className="text-xl font-semibold text-gray-700">
                        {description}
                    </p>
                    <p className="text-sm text-gray-500">
                        H: {Math.round(daily.temperature_2m_max[todayIndex])}°
                        L: {Math.round(daily.temperature_2m_min[todayIndex])}°
                    </p>
                </div>
            </div>
        </div>
    );
};

// (The rest of the sub-components are unchanged)
const HourlyForecastChart = ({ hourly }) => {
    const now = new Date();
    const startIndex = hourly.time.findIndex((t) => new Date(t) >= now);
    const chartData = hourly.time
        .slice(startIndex, startIndex + 24)
        .map((t, i) => ({
            time: formatTime(t, { hour: "numeric" }),
            temp: Math.round(hourly.temperature_2m[startIndex + i]),
            precip: hourly.precipitation_probability[startIndex + i],
        }));

    return (
        <div className="h-40 mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={chartData}
                    margin={{ top: 5, right: 20, left: -10, bottom: 0 }}
                >
                    <XAxis
                        dataKey="time"
                        axisLine={false}
                        tickLine={false}
                        fontSize={12}
                        interval={2}
                    />
                    <YAxis domain={["dataMin - 2", "dataMax + 2"]} hide />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "rgba(255, 255, 255, 0.8)",
                            border: "1px solid #ccc",
                            borderRadius: "10px",
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="temp"
                        stroke="#f97316"
                        fill="#fed7aa"
                        strokeWidth={2}
                        dot={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
const WindCard = ({ current }) => (
    <div className="p-4 bg-white/70 rounded-2xl shadow-lg">
        <h3 className="font-semibold text-gray-600 flex items-center gap-2 mb-2">
            <Wind size={20} /> Wind
        </h3>
        <div className="flex justify-between items-center">
            <div>
                <p className="text-2xl font-bold">
                    {Math.round(current.wind_speed_10m)}{" "}
                    <span className="text-sm font-normal">km/h</span>
                </p>
                <p className="text-sm text-gray-500">
                    Gust: {Math.round(current.wind_gusts_10m)} km/h
                </p>
            </div>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <div
                    style={{
                        transform: `rotate(${
                            current.wind_direction_10m - 45
                        }deg)`,
                    }}
                    className="transition-transform duration-500"
                >
                    <svg
                        width="30"
                        height="30"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M12 2L20 20L12 16L4 20L12 2Z" fill="#3b82f6" />
                    </svg>
                </div>
            </div>
        </div>
    </div>
);
const SunHoursCard = ({ daily, index }) => (
    <div className="p-4 bg-white/70 rounded-2xl shadow-lg flex flex-col justify-between">
        <h3 className="font-semibold text-gray-600">Sun Hours</h3>
        <div className="flex justify-between items-center text-center mt-2">
            <div>
                <Sun size={24} className="mx-auto text-amber-500" />
                <p className="font-bold text-lg">
                    {formatTime(daily.sunrise[index])}
                </p>
                <p className="text-xs text-gray-500">Sunrise</p>
            </div>
            <div>
                <Sunset size={24} className="mx-auto text-orange-500" />
                <p className="font-bold text-lg">
                    {formatTime(daily.sunset[index])}
                </p>
                <p className="text-xs text-gray-500">Sunset</p>
            </div>
        </div>
    </div>
);
const InfoCard = ({ icon, title, value, description }) => (
    <div className="p-4 bg-white/70 rounded-2xl shadow-lg">
        <h3 className="font-semibold text-gray-600 flex items-center gap-2 mb-1">
            {icon} {title}
        </h3>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{description}</p>
    </div>
);

export default WeatherDashboard;
