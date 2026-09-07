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
    CloudSun,
    Clock,
    Calendar,
    AlertTriangle,
    CloudRain,
} from "lucide-react";
import { getWeatherInfo, formatTime } from "./weatherUtils.jsx";

const WeatherDashboard = () => {
    const [weatherData, setWeatherData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [activeTab, setActiveTab] = useState('now'); // 'now', 'hourly', '7day', 'alerts'
    const [windowWidth, setWindowWidth] = useState(
        typeof window !== 'undefined' ? window.innerWidth : 1024
    );

    // Handle window resize for responsive behavior
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
    const isSmallMobile = windowWidth < 400;

    useEffect(() => {
        const fetchWeather = async () => {
            // --- 1. UPDATE THE COORDINATES HERE ---
            const lat = 17.15; // Ilagan Latitude
            const lon = 121.89; // Ilagan Longitude
            const timezone = "Asia/Manila";
            const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,visibility,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&timezone=${timezone}`;

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
            <div className="flex items-center justify-center p-4 sm:p-6 bg-white rounded-lg min-h-[200px] sm:min-h-[300px]">
                <Loader2 className="animate-spin mr-2 w-5 h-5 sm:w-6 sm:h-6" /> 
                <span className="text-sm sm:text-base">Loading weather dashboard...</span>
            </div>
        );
    }

    if (!weatherData) {
        return (
            <div className="p-4 sm:p-6 text-center text-red-500 bg-white rounded-lg">
                <p className="text-sm sm:text-base">Could not load weather data.</p>
            </div>
        );
    }

    const { current, daily, hourly } = weatherData;
    const todayIndex = 0;

    // Tab configuration
    const tabs = [
        { id: 'now', label: 'Now', icon: CloudSun },
        { id: 'hourly', label: 'Hourly', icon: Clock },
        { id: '7day', label: '7 Days', icon: Calendar },
        { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
    ];

    return (
        <div className="space-y-3 sm:space-y-4 font-sans">
            {/* Tab Navigation */}
            <div className="bg-white/70 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg p-2 sm:p-3">
                <div className="flex gap-1 sm:gap-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-200 min-h-[44px] ${
                                    isActive
                                        ? 'bg-blue-500 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                <Icon size={isMobile ? 16 : 18} />
                                <span className={`${isSmallMobile ? 'text-xs' : isMobile ? 'text-sm' : 'text-base'}`}>
                                    {tab.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'now' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                    {/* Main Weather Card */}
                    <div className="p-4 sm:p-6 bg-white/70 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg flex flex-col justify-between min-h-[320px] sm:min-h-[400px]">
                        <CurrentWeatherBlock
                            current={current}
                            daily={daily}
                            lastUpdated={lastUpdated}
                            isMobile={isMobile}
                            isSmallMobile={isSmallMobile}
                        />
                        <HourlyForecastChart 
                            hourly={hourly} 
                            isMobile={isMobile}
                            isTablet={isTablet}
                            isSmallMobile={isSmallMobile}
                        />
                    </div>
                    
                    {/* Weather Details Grid */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                        <InfoCard
                            icon={<Eye size={isMobile ? 18 : 20} />}
                            title="Visibility"
                            value={`${(current.visibility / 1000).toFixed(1)} km`}
                            description="Excellent"
                            isMobile={isMobile}
                        />
                        <InfoCard
                            icon={<Droplets size={isMobile ? 18 : 20} />}
                            title="Humidity"
                            value={`${current.relative_humidity_2m}%`}
                            description="Extremely Humid"
                            isMobile={isMobile}
                        />
                        <WindCard current={current} isMobile={isMobile} isSmallMobile={isSmallMobile} />
                        <SunHoursCard daily={daily} index={todayIndex} isMobile={isMobile} />
                        <InfoCard
                            icon={<Gauge size={isMobile ? 18 : 20} />}
                            title="Pressure"
                            value={`${Math.round(current.pressure_msl)} mb`}
                            description="Rising slowly"
                            isMobile={isMobile}
                        />
                        <InfoCard
                            icon={<Thermometer size={isMobile ? 18 : 20} />}
                            title="Feels Like"
                            value={`${Math.round(current.apparent_temperature)}°`}
                            description="Similar to actual"
                            isMobile={isMobile}
                        />
                    </div>
                </div>
            )}

            {activeTab === 'hourly' && (
                <HourlyForecastView 
                    hourly={hourly} 
                    isMobile={isMobile}
                    isTablet={isTablet}
                    isSmallMobile={isSmallMobile}
                />
            )}

            {activeTab === '7day' && (
                <SevenDayForecastView 
                    daily={daily} 
                    isMobile={isMobile}
                    isSmallMobile={isSmallMobile}
                />
            )}

            {activeTab === 'alerts' && (
                <WeatherAlertsView 
                    current={current}
                    hourly={hourly}
                    daily={daily}
                    isMobile={isMobile}
                    isSmallMobile={isSmallMobile}
                />
            )}
        </div>
    );
};

const CurrentWeatherBlock = ({ current, daily, lastUpdated, isMobile, isSmallMobile }) => {
    const { icon, description } = getWeatherInfo(current.weather_code);
    const todayIndex = 0;

    return (
        <div>
            <div className="flex justify-between items-start">
                <div>
                    {/* --- 2. UPDATE THE DISPLAYED LOCATION NAME HERE --- */}
                    <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-800`}>
                        Ilagan, Cagayan Valley
                    </h2>
                    <p className={`${isSmallMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>
                        {lastUpdated
                            ? `Updated at ${formatTime(lastUpdated)}`
                            : "..."}
                    </p>
                </div>
                <div className={`${isMobile ? 'text-3xl' : 'text-4xl'} text-gray-700`}>{icon}</div>
            </div>
            <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center gap-4'} mt-2`}>
                <p className={`${isSmallMobile ? 'text-5xl' : isMobile ? 'text-6xl' : 'text-7xl'} font-bold text-gray-900`}>
                    {Math.round(current.temperature_2m)}°C
                </p>
                <div>
                    <p className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-gray-700`}>
                        {description}
                    </p>
                    <p className={`${isSmallMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>
                        H: {Math.round(daily.temperature_2m_max[todayIndex])}°
                        L: {Math.round(daily.temperature_2m_min[todayIndex])}°
                    </p>
                </div>
            </div>
        </div>
    );
};

// (The rest of the sub-components are unchanged)
const HourlyForecastChart = ({ hourly, isMobile, isTablet, isSmallMobile }) => {
    const now = new Date();
    const startIndex = hourly.time.findIndex((t) => new Date(t) >= now);
    const chartData = hourly.time
        .slice(startIndex, startIndex + 24)
        .map((t, i) => ({
            time: formatTime(t, { hour: "numeric" }),
            temp: Math.round(hourly.temperature_2m[startIndex + i]),
            precip: hourly.precipitation_probability[startIndex + i],
        }));

    const chartHeight = isMobile ? 160 : isTablet ? 180 : 200;
    const fontSize = isSmallMobile ? 10 : isMobile ? 11 : 12;
    const interval = isMobile ? 3 : 2;

    return (
        <div className={`${isMobile ? 'h-40' : 'h-48'} mt-4`}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={chartData}
                    margin={{ 
                        top: 5, 
                        right: isMobile ? 10 : 20, 
                        left: isMobile ? -15 : -10, 
                        bottom: 0 
                    }}
                >
                    <XAxis
                        dataKey="time"
                        axisLine={false}
                        tickLine={false}
                        fontSize={fontSize}
                        interval={interval}
                    />
                    <YAxis domain={["dataMin - 2", "dataMax + 2"]} hide />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            border: "1px solid #ccc",
                            borderRadius: "10px",
                            fontSize: isMobile ? '12px' : '14px',
                            padding: isMobile ? '6px 8px' : '8px 12px',
                        }}
                        labelStyle={{ fontWeight: 'bold' }}
                        formatter={(value, name) => {
                            if (name === 'temp') return [`${value}°C`, 'Temperature'];
                            if (name === 'precip') return [`${value}%`, 'Rain Chance'];
                            return [value, name];
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
const WindCard = ({ current, isMobile, isSmallMobile }) => (
    <div className={`${isMobile ? 'p-3' : 'p-4'} bg-white/70 rounded-xl sm:rounded-2xl shadow-lg`}>
        <h3 className={`font-semibold text-gray-600 flex items-center gap-2 ${isSmallMobile ? 'mb-1 text-sm' : 'mb-2'}`}>
            <Wind size={isMobile ? 16 : 20} /> Wind
        </h3>
        <div className="flex justify-between items-center">
            <div>
                <p className={`${isSmallMobile ? 'text-xl' : isMobile ? 'text-2xl' : 'text-2xl'} font-bold`}>
                    {Math.round(current.wind_speed_10m)}{" "}
                    <span className={`${isSmallMobile ? 'text-xs' : 'text-sm'} font-normal`}>km/h</span>
                </p>
                <p className={`${isSmallMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>
                    Gust: {Math.round(current.wind_gusts_10m)} km/h
                </p>
            </div>
            <div className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} bg-blue-100 rounded-full flex items-center justify-center`}>
                <div
                    style={{
                        transform: `rotate(${
                            current.wind_direction_10m - 45
                        }deg)`,
                    }}
                    className="transition-transform duration-500"
                >
                    <svg
                        width={isMobile ? "24" : "30"}
                        height={isMobile ? "24" : "30"}
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
const SunHoursCard = ({ daily, index, isMobile }) => (
    <div className={`${isMobile ? 'p-3' : 'p-4'} bg-white/70 rounded-xl sm:rounded-2xl shadow-lg flex flex-col justify-between`}>
        <h3 className={`font-semibold text-gray-600 ${isMobile ? 'text-sm mb-1' : 'mb-2'}`}>Sun Hours</h3>
        <div className={`flex justify-between items-center text-center ${isMobile ? 'mt-1' : 'mt-2'}`}>
            <div>
                <Sun size={isMobile ? 20 : 24} className="mx-auto text-amber-500" />
                <p className={`font-bold ${isMobile ? 'text-base' : 'text-lg'} mt-1`}>
                    {formatTime(daily.sunrise[index])}
                </p>
                <p className="text-xs text-gray-500">Sunrise</p>
            </div>
            <div>
                <Sunset size={isMobile ? 20 : 24} className="mx-auto text-orange-500" />
                <p className={`font-bold ${isMobile ? 'text-base' : 'text-lg'} mt-1`}>
                    {formatTime(daily.sunset[index])}
                </p>
                <p className="text-xs text-gray-500">Sunset</p>
            </div>
        </div>
    </div>
);
const InfoCard = ({ icon, title, value, description, isMobile }) => (
    <div className={`${isMobile ? 'p-3' : 'p-4'} bg-white/70 rounded-xl sm:rounded-2xl shadow-lg`}>
        <h3 className={`font-semibold text-gray-600 flex items-center gap-2 ${isMobile ? 'mb-1 text-sm' : 'mb-1'}`}>
            {icon} {title}
        </h3>
        <p className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900`}>{value}</p>
        <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>{description}</p>
    </div>
);

// Hourly Forecast View
const HourlyForecastView = ({ hourly, isMobile, isTablet, isSmallMobile }) => {
    const now = new Date();
    const startIndex = hourly.time.findIndex((t) => new Date(t) >= now);
    const next24Hours = hourly.time.slice(startIndex, startIndex + 24);

    return (
        <div className="bg-white/70 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
            <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-800 mb-4`}>
                24-Hour Forecast
            </h3>
            <div className="overflow-x-auto -mx-2 px-2">
                <div className="flex gap-3 sm:gap-4 min-w-max pb-2">
                    {next24Hours.map((time, i) => {
                        const index = startIndex + i;
                        const { icon } = getWeatherInfo(hourly.weather_code[index]);
                        const temp = Math.round(hourly.temperature_2m[index]);
                        const precip = hourly.precipitation_probability[index];
                        const windSpeed = Math.round(hourly.wind_speed_10m[index]);
                        const hour = new Date(time).getHours();
                        const displayTime = hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;

                        return (
                            <div
                                key={time}
                                className={`flex flex-col items-center gap-2 ${isMobile ? 'p-2' : 'p-3'} bg-white/50 rounded-lg min-w-[80px] sm:min-w-[90px]`}
                            >
                                <p className={`${isSmallMobile ? 'text-xs' : 'text-sm'} font-semibold text-gray-700`}>
                                    {displayTime}
                                </p>
                                <div className="text-2xl">{icon}</div>
                                <p className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900`}>
                                    {temp}°
                                </p>
                                <div className="flex items-center gap-1 text-blue-500">
                                    <Droplets size={14} />
                                    <span className="text-xs">{precip}%</span>
                                </div>
                                <div className="flex items-center gap-1 text-gray-500">
                                    <Wind size={14} />
                                    <span className="text-xs">{windSpeed}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// 7-Day Forecast View
const SevenDayForecastView = ({ daily, isMobile, isSmallMobile }) => {
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return (
        <div className="bg-white/70 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
            <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-800 mb-4`}>
                7-Day Forecast
            </h3>
            <div className="space-y-2 sm:space-y-3">
                {daily.time.slice(0, 7).map((date, index) => {
                    const { icon, description } = getWeatherInfo(daily.weather_code[index]);
                    const dayName = index === 0 ? 'Today' : daysOfWeek[new Date(date).getDay()];
                    const maxTemp = Math.round(daily.temperature_2m_max[index]);
                    const minTemp = Math.round(daily.temperature_2m_min[index]);
                    const precipProb = daily.precipitation_probability_max[index];
                    const windSpeed = Math.round(daily.wind_speed_10m_max[index]);

                    return (
                        <div
                            key={date}
                            className={`flex items-center justify-between ${isMobile ? 'p-3' : 'p-4'} bg-white/50 rounded-lg hover:bg-white/70 transition-colors`}
                        >
                            <div className="flex items-center gap-3 sm:gap-4 flex-1">
                                <p className={`${isMobile ? 'w-16 text-sm' : 'w-20 text-base'} font-semibold text-gray-700`}>
                                    {dayName}
                                </p>
                                <div className="flex items-center gap-2 flex-1">
                                    <div className="text-2xl">{icon}</div>
                                    <p className={`${isSmallMobile ? 'text-xs' : 'text-sm'} text-gray-600 hidden sm:block`}>
                                        {description}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 sm:gap-6">
                                <div className="flex items-center gap-1 text-blue-500">
                                    <Droplets size={isMobile ? 14 : 16} />
                                    <span className={`${isSmallMobile ? 'text-xs' : 'text-sm'}`}>{precipProb}%</span>
                                </div>
                                <div className="flex items-center gap-1 text-gray-500 hidden sm:flex">
                                    <Wind size={16} />
                                    <span className="text-sm">{windSpeed}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-gray-900`}>
                                        {maxTemp}°
                                    </span>
                                    <span className={`${isSmallMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>
                                        {minTemp}°
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Weather Alerts View
const WeatherAlertsView = ({ current, hourly, daily, isMobile, isSmallMobile }) => {
    const alerts = [];

    // Check for heavy rain (>70% precipitation in next 6 hours)
    const now = new Date();
    const startIndex = hourly.time.findIndex((t) => new Date(t) >= now);
    const next6Hours = hourly.precipitation_probability.slice(startIndex, startIndex + 6);
    const hasHeavyRain = next6Hours.some(prob => prob > 70);
    
    if (hasHeavyRain) {
        const startHour = new Date(hourly.time[startIndex]).getHours();
        const endHour = (startHour + 6) % 24;
        alerts.push({
            type: 'rain',
            severity: 'warning',
            title: 'Heavy Rain Expected',
            message: `Heavy rain expected between ${startHour > 12 ? startHour - 12 : startHour} ${startHour >= 12 ? 'PM' : 'AM'} and ${endHour > 12 ? endHour - 12 : endHour} ${endHour >= 12 ? 'PM' : 'AM'}. Avoid low-lying areas.`,
            icon: <CloudRain className="text-blue-600" size={24} />,
        });
    }

    // Check for strong winds (>40 km/h)
    if (current.wind_speed_10m > 40 || current.wind_gusts_10m > 60) {
        alerts.push({
            type: 'wind',
            severity: 'warning',
            title: 'Strong Wind Warning',
            message: `Current wind speed ${Math.round(current.wind_speed_10m)} km/h with gusts up to ${Math.round(current.wind_gusts_10m)} km/h. Secure loose objects.`,
            icon: <Wind className="text-orange-600" size={24} />,
        });
    }

    // Check for extreme heat (>35°C)
    const maxTempToday = daily.temperature_2m_max[0];
    if (maxTempToday > 35) {
        alerts.push({
            type: 'heat',
            severity: 'caution',
            title: 'Extreme Heat Advisory',
            message: `Temperature expected to reach ${Math.round(maxTempToday)}°C today. Stay hydrated and avoid prolonged sun exposure.`,
            icon: <Thermometer className="text-red-600" size={24} />,
        });
    }

    // Check for high UV index
    const uvIndex = daily.uv_index_max[0];
    if (uvIndex > 7) {
        alerts.push({
            type: 'uv',
            severity: 'caution',
            title: 'High UV Index',
            message: `UV index ${Math.round(uvIndex)} today. Wear sunscreen and protective clothing if going outdoors.`,
            icon: <Sun className="text-yellow-600" size={24} />,
        });
    }

    const severityColors = {
        warning: 'bg-orange-50 border-orange-300',
        caution: 'bg-yellow-50 border-yellow-300',
    };

    return (
        <div className="space-y-3 sm:space-y-4">
            <div className="bg-white/70 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
                <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-800 mb-4`}>
                    Weather Alerts
                </h3>
                
                {alerts.length === 0 ? (
                    <div className="text-center py-8">
                        <CloudSun className="mx-auto text-gray-400 mb-3" size={48} />
                        <p className="text-gray-600">No weather alerts at this time</p>
                        <p className={`${isSmallMobile ? 'text-xs' : 'text-sm'} text-gray-500 mt-2`}>
                            Weather conditions are normal
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {alerts.map((alert, index) => (
                            <div
                                key={index}
                                className={`${isMobile ? 'p-3' : 'p-4'} ${severityColors[alert.severity]} border-2 rounded-lg`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 mt-1">{alert.icon}</div>
                                    <div className="flex-1">
                                        <h4 className={`${isMobile ? 'text-sm' : 'text-base'} font-bold text-gray-900 mb-1`}>
                                            {alert.title}
                                        </h4>
                                        <p className={`${isSmallMobile ? 'text-xs' : 'text-sm'} text-gray-700`}>
                                            {alert.message}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WeatherDashboard;
