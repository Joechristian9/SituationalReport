import React from "react"; // Import React to use JSX for icons
import {
    Sun,
    Cloud,
    CloudRain,
    CloudSnow,
    CloudLightning,
    Haze,
    CloudDrizzle,
    CloudSun,
    CloudFog,
    Snowflake,
    CloudHail,
    Wind,
} from "lucide-react";

// Map WMO weather codes to icons and descriptions
export const getWeatherInfo = (code) => {
    const weatherMap = {
        0: {
            description: "Clear sky",
            icon: <Sun className="text-yellow-500" size={32} />,
        },
        1: {
            description: "Mainly clear",
            icon: <Sun className="text-yellow-400" size={32} />,
        },
        2: {
            description: "Partly cloudy",
            icon: <CloudSun className="text-amber-500" size={32} />,
        },
        3: {
            description: "Overcast",
            icon: <Cloud className="text-gray-500" size={32} />,
        },
        45: { 
            description: "Fog", 
            icon: <CloudFog className="text-gray-400" size={32} /> 
        },
        48: {
            description: "Depositing rime fog",
            icon: <Haze className="text-gray-400" size={32} />,
        },
        51: {
            description: "Light drizzle",
            icon: <CloudDrizzle className="text-blue-400" size={32} />,
        },
        53: {
            description: "Moderate drizzle",
            icon: <CloudDrizzle className="text-blue-500" size={32} />,
        },
        55: {
            description: "Dense drizzle",
            icon: <CloudDrizzle className="text-blue-600" size={32} />,
        },
        56: {
            description: "Freezing drizzle",
            icon: <CloudDrizzle className="text-cyan-500" size={32} />,
        },
        57: {
            description: "Freezing drizzle",
            icon: <CloudDrizzle className="text-cyan-600" size={32} />,
        },
        61: {
            description: "Slight rain",
            icon: <CloudRain className="text-blue-500" size={32} />,
        },
        63: {
            description: "Moderate rain",
            icon: <CloudRain className="text-blue-600" size={32} />,
        },
        65: {
            description: "Heavy rain",
            icon: <CloudRain className="text-blue-700" size={32} />,
        },
        66: {
            description: "Light freezing rain",
            icon: <CloudRain className="text-cyan-500" size={32} />,
        },
        67: {
            description: "Heavy freezing rain",
            icon: <CloudRain className="text-cyan-700" size={32} />,
        },
        71: {
            description: "Slight snow",
            icon: <CloudSnow className="text-sky-400" size={32} />,
        },
        73: {
            description: "Moderate snow",
            icon: <CloudSnow className="text-sky-500" size={32} />,
        },
        75: {
            description: "Heavy snow",
            icon: <CloudSnow className="text-sky-600" size={32} />,
        },
        77: {
            description: "Snow grains",
            icon: <Snowflake className="text-sky-400" size={32} />,
        },
        80: {
            description: "Slight rain showers",
            icon: <CloudRain className="text-blue-500" size={32} />,
        },
        81: {
            description: "Moderate rain showers",
            icon: <CloudRain className="text-blue-600" size={32} />,
        },
        82: {
            description: "Violent rain showers",
            icon: <CloudRain className="text-blue-800" size={32} />,
        },
        85: {
            description: "Slight snow showers",
            icon: <CloudSnow className="text-sky-400" size={32} />,
        },
        86: {
            description: "Heavy snow showers",
            icon: <CloudSnow className="text-sky-600" size={32} />,
        },
        95: {
            description: "Thunderstorm",
            icon: <CloudLightning className="text-yellow-500" size={32} />,
        },
        96: {
            description: "Thunderstorm with slight hail",
            icon: <CloudHail className="text-purple-500" size={32} />,
        },
        99: {
            description: "Thunderstorm with heavy hail",
            icon: <CloudHail className="text-purple-700" size={32} />,
        },
    };
    return (
        weatherMap[code] || {
            description: "Clear sky",
            icon: <Sun className="text-yellow-400" size={32} />,
        }
    );
};

// Format time for display
export const formatTime = (dateString, options = {}) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        ...options,
    });
};
