'use client';

import { useState, useEffect } from 'react';
import { Wind, Droplets, Thermometer } from 'lucide-react';

interface WeatherData {
  temp: string;
  feelsLike: string;
  condition: string;
  humidity: string;
  windSpeed: string;
  windDir: string;
  icon: string;
  location: string;
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeather();
  }, []);

  const fetchWeather = async () => {
    try {
      const response = await fetch('/api/weather');
      if (response.ok) {
        const data = await response.json();
        setWeather(data);
      }
    } catch (err) {
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-3 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
      </div>
    );
  }

  if (!weather) {
    return null;
  }

  return (
    <div className="glass-card rounded-xl p-4 h-full flex items-center">
      <div className="flex items-center gap-4 w-full">
        {/* Icon & Temp */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">{weather.icon}</span>
          <div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{weather.temp}°C</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{weather.condition}</p>
          </div>
        </div>
        
        {/* Divider */}
        <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
        
        {/* Wind */}
        <div className="flex items-center gap-1.5">
          <Wind className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <span className="text-sm text-gray-900 dark:text-white">{weather.windSpeed}<span className="text-xs text-gray-500"> km/h</span></span>
        </div>
        
        {/* Humidity */}
        <div className="flex items-center gap-1.5">
          <Droplets className="w-4 h-4 text-blue-500" />
          <span className="text-sm text-gray-900 dark:text-white">{weather.humidity}<span className="text-xs text-gray-500">%</span></span>
        </div>
      </div>
    </div>
  );
}
