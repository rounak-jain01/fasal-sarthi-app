// src/pages/WeatherPage.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useWeather } from '../Context/WeatherContext';
import {
  LuSearch, LuLoader, LuTriangleAlert as LuAlertTriangle,
  LuWind, LuDroplet, LuMapPin,
  LuSunrise, LuSunset, LuEye, LuGauge, LuCloud, LuUmbrella, LuNavigation
} from 'react-icons/lu';

// --- Premium Glassmorphism Detail Item ---
const DetailItem = ({ icon, label, value, unit, extraIcon }) => {
  const { t } = useTranslation();
  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 text-white flex flex-col items-center justify-center shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] transition-transform hover:scale-105 duration-300">
      <div className="text-3xl mb-3 text-emerald-300">{icon}</div>
      <div className="text-center">
        <p className="font-bold text-2xl tracking-wide flex items-center justify-center gap-2">
          {value !== null && value !== undefined ? value : '--'}
          {unit && (value !== null && value !== undefined) && <span className="text-sm font-medium opacity-80">{unit}</span>}
          {extraIcon && <span className="text-lg text-emerald-300 ml-1">{extraIcon}</span>}
        </p>
        <p className="text-xs font-medium opacity-70 uppercase tracking-widest mt-1">
          {t(label)}
        </p>
      </div>
    </div>
  );
};

function WeatherPage() {
  const { t } = useTranslation();
  const [searchCity, setSearchCity] = useState('');
  const { weatherData, isLoading, error: contextError, fetchWeather } = useWeather();
  const [geoError, setGeoError] = useState(null);

  // 👇 --- YAHAN SE NAYA CODE ADD KAREIN --- 👇
  useEffect(() => {
    // Agar weatherData mein kuch data hai, toh use console mein dikhao
    if (weatherData) {
      console.log("☁️ FRONTEND DATA (From Backend):", weatherData);
    }
  }, [weatherData]);
  // 👆 --- YAHAN TAK --- 👆


  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchCity.trim()) return;
    setGeoError(null);
    fetchWeather(searchCity);
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setGeoError(t('weather_error_geolocation_not_supported'));
      return;
    }
    setGeoError(null);
    setSearchCity('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchWeather({ lat: position.coords.latitude, lon: position.coords.longitude });
      },
      (geoErr) => {
        console.error("Geolocation error:", geoErr);
        setGeoError(t('weather_error_geolocation_failed', { message: geoErr.message }));
      }
    );
  };

  const displayError = contextError || geoError;

  return (
    <main className="relative min-h-screen flex flex-col overflow-hidden font-sans">
      
      {/* Background Image with Dark Overlay for Premium Look */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(/Weather.jpg)` }}
      >
        {/* Dark overlay makes white glassmorphism text pop */}
        <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-[2px]"></div>
      </div>

      {/* Content Wrapper */}
      <div className="relative z-10 flex-1 flex flex-col overflow-y-auto pb-20 md:pb-8">
        
        {/* Search Section (Glassy Dashboard Style) */}
        <div className="pt-8 pb-4 px-4 md:px-6 w-full max-w-3xl mx-auto">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative grow">
              <input
                type="text"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                placeholder={t('weather_search_placeholder') + " (e.g. Bhopal, IN)"} 
                className="w-full pl-5 pr-12 py-4 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-400 text-white placeholder-gray-200 shadow-lg text-lg"
                disabled={isLoading}
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-md transition-colors disabled:opacity-50"
                disabled={isLoading || !searchCity.trim()}
              >
                {isLoading && !geoError ? <LuLoader className="animate-spin text-xl" /> : <LuSearch className="text-xl"/>}
              </button>
            </div>
            <button
              type="button"
              onClick={handleDetectLocation}
              className="px-6 py-4 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white rounded-2xl shadow-lg flex items-center justify-center transition-colors disabled:opacity-50 whitespace-nowrap"
              disabled={isLoading}
            >
              <LuMapPin className="text-xl mr-2 text-emerald-300" />
              <span className="font-medium">{t('weather_detect_button_desktop')}</span>
            </button>
          </form>
          {geoError && <p className="text-red-400 text-sm mt-3 text-center bg-black/40 py-2 rounded-lg backdrop-blur-sm">{geoError}</p>}
        </div>

        {/* --- Main Weather Display Area --- */}
        <div className="flex-1 flex flex-col items-center px-4 md:px-6 w-full">

          {isLoading && (
            <div className="mt-20 flex flex-col items-center">
              <div className="p-4 bg-white/10 rounded-full backdrop-blur-md mb-4 shadow-xl">
                <LuLoader className="animate-spin text-5xl text-emerald-400" />
              </div>
              <p className="text-white text-lg font-medium tracking-wide">{t('weather_loading_data')}</p>
            </div>
          )}

          {displayError && !isLoading && (
            <div className="w-full max-w-md mx-auto mt-10 p-5 bg-red-500/20 backdrop-blur-md border border-red-500/50 rounded-2xl shadow-2xl text-white">
              <div className="flex items-center gap-3">
                <LuAlertTriangle className="text-3xl text-red-400 shrink-0"/>
                <p className="text-base font-medium">{displayError}</p>
              </div>
            </div>
          )}

          {weatherData && !isLoading && (
            <div className="w-full max-w-4xl mx-auto mt-6 animate-fadeIn pb-10">
              
              {/* Main Hero Weather Card */}
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] p-8 md:p-12 text-white shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
                
                {/* Left Side: Temp & City */}
                <div className="text-center md:text-left">
                  <h2 className="text-4xl md:text-5xl font-extrabold mb-2 tracking-tight">
                    {weatherData.city}, <span className="text-emerald-300 font-light">{weatherData.country}</span>
                  </h2>
                  <p className="text-lg opacity-80 uppercase tracking-widest font-medium mb-6">
                    {t(`weather_desc_${weatherData.description?.toLowerCase().replace(/ /g, '_')}`, { defaultValue: weatherData.description })}
                  </p>
                  <div className="text-7xl md:text-8xl font-black tracking-tighter drop-shadow-lg">
                    {weatherData.temperature !== null ? `${Math.round(weatherData.temperature)}°` : '--'}
                  </div>
                </div>

                {/* Right Side: Icon & High/Low */}
                <div className="flex flex-col items-center justify-center bg-white/5 p-6 rounded-3xl border border-white/10 w-full md:w-auto min-w-[250px]">
                  {weatherData.icon_url && (
                    <img
                      src={weatherData.icon_url}
                      alt={weatherData.description}
                      className="w-32 h-32 object-contain drop-shadow-2xl mb-2"
                    />
                  )}
                  <div className="flex flex-col gap-2 w-full text-center">
                     <div className="flex justify-between border-b border-white/10 pb-2">
                        <span className="opacity-70">{t('weather_feels_like')}</span>
                        <span className="font-bold">{weatherData.feels_like !== null ? `${Math.round(weatherData.feels_like)}°` : '--'}</span>
                     </div>
                     <div className="flex justify-between border-b border-white/10 pb-2 pt-1">
                        <span className="opacity-70">{t('weather_high')}</span>
                        <span className="font-bold">{weatherData.temp_max !== null ? `${Math.round(weatherData.temp_max)}°` : '--'}</span>
                     </div>
                     <div className="flex justify-between pt-1">
                        <span className="opacity-70">{t('weather_low')}</span>
                        <span className="font-bold">{weatherData.temp_min !== null ? `${Math.round(weatherData.temp_min)}°` : '--'}</span>
                     </div>
                  </div>
                </div>
              </div>

              {/* Advanced Weather Details Grid */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                 <DetailItem icon={<LuWind/>} label="weather_wind_speed" value={weatherData.wind_speed} unit="m/s" />
                 <DetailItem icon={<LuDroplet/>} label="weather_humidity" value={weatherData.humidity} unit="%" />
                 <DetailItem icon={<LuGauge/>} label="weather_pressure" value={weatherData.pressure} unit="hPa" />
                 <DetailItem icon={<LuEye/>} label="weather_visibility" value={weatherData.visibility} unit="km" />
                 
                 <DetailItem icon={<LuCloud/>} label="weather_clouds" value={weatherData.clouds} unit="%" />
                 {weatherData.rain_1h > 0 && (
                   <DetailItem icon={<LuUmbrella/>} label="weather_rain_1h" value={weatherData.rain_1h} unit="mm" />
                 )}

                 {/* Sunrise / Sunset Combined Card */}
                 <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 text-white shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] col-span-2 flex justify-around items-center">
                   <div className="text-center flex flex-col items-center">
                     <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mb-2">
                        <LuSunrise className="text-2xl text-emerald-300" />
                     </div>
                     <p className="font-bold text-xl tracking-wide">{weatherData.sunrise ?? '--'}</p>
                     <p className="text-xs opacity-70 uppercase tracking-widest mt-1">{t('weather_sunrise')}</p>
                   </div>
                   <div className="h-16 w-[1px] bg-white/20"></div> {/* Divider */}
                   <div className="text-center flex flex-col items-center">
                     <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mb-2">
                        <LuSunset className="text-2xl text-orange-300" />
                     </div>
                     <p className="font-bold text-xl tracking-wide">{weatherData.sunset ?? '--'}</p>
                     <p className="text-xs opacity-70 uppercase tracking-widest mt-1">{t('weather_sunset')}</p>
                   </div>
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default WeatherPage;