import React from "react"; // Import React to use JSX for icons
import {
    Sun,
    Cloud,
    CloudRain,
    CloudSnow,
    CloudLightning,
    Haze,
} from "lucide-react";

// Map WMO weather codes to icons and descriptions
export const getWeatherInfo = (code) => {
    const weatherMap = {
        0: {
            description: "Clear sky",
            icon: <Sun className="text-yellow-400" />,
        },
        1: {
            description: "Mainly clear",
            icon: <Sun className="text-yellow-400" />,
        },
        2: {
            description: "Partly cloudy",
            icon: <Cloud className="text-gray-400" />,
        },
        3: {
            description: "Overcast",
            icon: <Cloud className="text-gray-500" />,
        },
        45: { description: "Fog", icon: <Haze className="text-gray-400" /> },
        48: {
            description: "Depositing rime fog",
            icon: <Haze className="text-gray-400" />,
        },
        61: {
            description: "Slight rain",
            icon: <CloudRain className="text-blue-500" />,
        },
        63: {
            description: "Moderate rain",
            icon: <CloudRain className="text-blue-500" />,
        },
        65: {
            description: "Heavy rain",
            icon: <CloudRain className="text-blue-600" />,
        },
        80: {
            description: "Slight rain showers",
            icon: <CloudRain className="text-blue-500" />,
        },
        81: {
            description: "Moderate rain showers",
            icon: <CloudRain className="text-blue-500" />,
        },
        82: {
            description: "Violent rain showers",
            icon: <CloudRain className="text-blue-700" />,
        },
        95: {
            description: "Thunderstorm",
            icon: <CloudLightning className="text-yellow-500" />,
        },
    };
    return (
        weatherMap[code] || {
            description: "Clear sky",
            icon: <Sun className="text-yellow-400" />,
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
