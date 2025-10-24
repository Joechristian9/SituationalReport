import React, { useState, useEffect } from "react";
import { Sun, Cloud, CloudRain, Wind, Loader2 } from "lucide-react";

const CurrentWeather = () => {
    const [weatherData, setWeatherData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchWeatherData = async () => {
            try {
                // API URL for Manila, Philippines with current weather data
                const response = await fetch(
                    "https://api.open-meteo.com/v1/forecast?latitude=14.5995&longitude=120.9842&current_weather=true&timezone=Asia/Manila"
                );
                if (!response.ok) {
                    throw new Error("Weather data not available");
                }
                const data = await response.json();
                setWeatherData(data);
            } catch (error) {
                console.error("Error fetching current weather data:", error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchWeatherData();
    }, []); // Empty dependency array means this runs once when the component mounts

    const getWeatherIcon = (weathercode) => {
        if (weathercode >= 0 && weathercode <= 1)
            return <Sun size={48} className="text-yellow-400" />;
        if (weathercode >= 2 && weathercode <= 3)
            return <Cloud size={48} className="text-gray-400" />;
        if (weathercode >= 51 && weathercode <= 67)
            return <CloudRain size={48} className="text-blue-500" />;
        // Add more weather codes as needed from Open-Meteo documentation
        return <Sun size={48} className="text-yellow-400" />; // Default icon
    };

    if (loading) {
        return (
            <div className="bg-white shadow-lg rounded-2xl p-6 flex items-center justify-center h-full">
                <Loader2 size={24} className="animate-spin text-gray-500" />
                <span className="ml-2 text-gray-600">Loading Weather...</span>
            </div>
        );
    }

    if (error || !weatherData || !weatherData.current_weather) {
        return (
            <div className="bg-white shadow-lg rounded-2xl p-6 border-l-4 border-red-500 h-full">
                <h3 className="font-bold text-gray-800 text-lg">
                    Current Weather
                </h3>
                <p className="text-red-600 mt-2">
                    Could not fetch weather data.
                </p>
            </div>
        );
    }

    const { temperature, windspeed, weathercode } = weatherData.current_weather;

    return (
        <div className="bg-white shadow-lg rounded-2xl p-6 border-l-4 border-cyan-500 h-full">
            <h3 className="font-bold text-gray-800 text-lg mb-4">
                Current Weather - Manila
            </h3>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {getWeatherIcon(weathercode)}
                    <div>
                        <p className="text-4xl font-bold text-gray-800">
                            {Math.round(temperature)}°C
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="flex items-center gap-2 text-gray-600">
                        <Wind size={20} />
                        <p>{windspeed} km/h</p>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Wind Speed</p>
                </div>
            </div>
        </div>
    );
};

export default CurrentWeather;
