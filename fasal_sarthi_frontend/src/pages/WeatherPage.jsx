import React, { useState, useEffect } from 'react';
import { useWeather } from '../Context/WeatherContext'; // Import context hook
import {
  LuSearch, LuLoader,LuTriangleAlert as LuAlertTriangle, // Corrected Alert Icon name
  LuWind, LuDroplet, LuMapPin,
  LuSunrise, LuSunset, LuEye, LuGauge, LuCloud, LuNavigation // Added LuNavigation
} from 'react-icons/lu';

// Helper function to get Wind Direction Icon Rotation
const getWindDirectionRotation = (deg) => {
    // Check if deg is a number before rotation
    if (typeof deg !== 'number') return 'rotate(180deg)'; // Default if no degree
    // CSS rotation is clockwise. Icon points North (0deg). Wind direction is FROM.
    return `rotate(${deg}deg)`; // No need to add 180 if icon shows direction wind goes TO, or adjust based on icon
    // Let's assume the icon points the direction wind is going TO for simplicity with LuNavigation
    // return `rotate(${deg}deg)`; // Simpler if LuNavigation points TO the direction
};

// --- Detail Item Component ---
// Refined for clarity and better prop handling
const DetailItem = ({ icon, label, value, unit }) => (
  <div className="bg-linear-to-br from-skyblue-200 to-blue-800  rounded-xl backdrop-blur-md p-4 text-center flex flex-col justify-center h-full shadow-lg font-extrabold ">
    <div className="text-2xl mb-2 opacity-80 flex justify-center">{icon}</div>
    <div>
      <p className="font-bold text-lg leading-tight">
        {/* Check if value exists before rendering */}
        {value !== null && value !== undefined ? value : '--'}
        {/* Render unit only if value exists */}
        {unit && (value !== null && value !== undefined) ? <span className="text-xs opacity-70 ml-1">{unit}</span> : ''}
      </p>
      <p className="text-xs opacity-70 uppercase tracking-wide mt-1">{label}</p>
    </div>
  </div>
);


// --- Main Weather Page Component ---
function WeatherPage() {
  const [searchCity, setSearchCity] = useState('');
  // Get everything from context
  const { weatherData, isLoading, error: contextError, fetchWeather, selectedCity } = useWeather();
  const [geoError, setGeoError] = useState(null); // Local error for geolocation

  // Handle manual city search
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchCity.trim()) return;
    setGeoError(null); // Clear geo error
    fetchWeather(searchCity);
    // Optional: Clear search input after submit
    // setSearchCity('');
  };

  // Handle automatic location detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    setGeoError(null);
    setSearchCity(''); // Clear search bar
    // Let context handle loading/error states
    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchWeather({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
      },
      (geoErr) => { // Use a different variable name to avoid conflict
        console.error("Geolocation error:", geoErr);
        setGeoError(`Could not detect location: ${geoErr.message}. Please allow access or search manually.`);
      }
    );
  };

  // Combine context error and geo error for display
  const displayError = contextError || geoError;

  return (
    // Corrected Gradient Syntax for main background
    <main className="flex-1 flex flex-col bg-linear-to-br from-emerald-100 to-green-200 overflow-hidden pb-20 md:pb-8 overflow-y-auto"
    style={{backgroundImage:`url(./src/assests/Weather.jpg)`,
      opacity:1.5,
      backgroundSize:'cover',
      backgroundPosition:'center'
    }}
    >

      {/* Search Section */}
      <div className="relative p-4 md:p-6  top-0 z-10 border-b backdrop-blur-md shadow-sm">
        <div className="max-w-xl mx-auto flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="grow flex space-x-2">
            <input
              type="text"
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              placeholder="Search city..."
              // Adjusted input style
              className="flex-1 w-full px-5 py-3 bg-white rounded-full shadow
                         border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-700"
              disabled={isLoading}
            />
            <button
              type="submit"
              // Adjusted button style
              className="p-4 bg-green-600 hover:bg-green-700 text-white rounded-full shadow flex items-center justify-center transition-colors disabled:bg-black"
              disabled={isLoading || !searchCity.trim()}
              aria-label="Search"
            >
              {/* Show loader only when search is submitted, not during geo-detect */}
              {isLoading && !geoError ? <LuLoader className="animate-spin text-xl" /> : <LuSearch className="text-xl"/>}
            </button>
          </form>
          {/* Adjusted detect button style */}
          <button
            onClick={handleDetectLocation}
            className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow flex items-center justify-center transition-colors disabled:bg-gray-400 whitespace-nowrap"
            disabled={isLoading}
            aria-label="Detect my location"
          >
            <LuMapPin className="text-xl" />
             <span className="sm:hidden ml-2">Detect</span> {/* Show text on mobile */}
             <span className="hidden sm:inline ml-2">Use My Location</span> {/* Show text on desktop */}
          </button>
        </div>
        {/* Error Display for Geolocation */}
        {geoError && <p className="text-red-600 text-xs mt-2 text-center max-w-xl mx-auto">{geoError}</p>}
      </div>

      {/* --- Main Weather Display Area --- */}
      <div className="flex-1 flex flex-col items-center p-4 md:p-6 text-gray-800">

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12 flex flex-col items-center">
            <LuLoader className="animate-spin text-4xl text-green-600" />
            <p className="mt-4 text-gray-600">Loading weather data...</p>
          </div>
        )}

        {/* Combined Error Display (Context + Geo) */}
        {displayError && !isLoading && ( // Show only when not loading
          <div className="max-w-md w-full mx-auto mt-6 p-4 bg-red-50 border border-red-200 rounded-lg shadow">
            <div className="flex items-center gap-2 text-red-600">
              <LuAlertTriangle className="text-xl shrink-0"/>
              <p className="text-sm font-medium">{displayError}</p>
            </div>
          </div>
        )}

        {/* Success State (Weather Data) */}
        {weatherData && !isLoading && (
          <div className="animate-fadeIn w-full max-w-2xl mx-auto">
            {/* Main Weather Card */}
            {/* Corrected gradient syntax and added icon */}
            <div className="bg-linear-to-br from-skyblue-200 to-blue-800
                            rounded-3xl p-6 text-white shadow-xl backdrop-blur-md relative overflow-hidden">

              {/* Weather Icon (Positioned absolutely) */}
              {weatherData.icon_url && (
                <img
                  src={weatherData.icon_url}
                  alt={weatherData.description}
                  className="w-24 h-24 absolute -top-4 -right-4 opacity-80"
                />
              )}

              <div className="text-center mb-6 relative z-1"> {/* Ensure text is above icon */}
                <h2 className="text-3xl font-bold mb-1">{weatherData.city}, {weatherData.country}</h2>
                <p className="text-lg opacity-90 capitalize">
                  {weatherData.description || 'Weather information'}
                </p>
                <div className="text-6xl font-light my-4">
                  {/* Added check for temperature */}
                  {weatherData.temperature !== null && weatherData.temperature !== undefined ? `${Math.round(weatherData.temperature)}°C` : '--'}
                </div>
                <div className="flex justify-center items-center gap-4 text-sm opacity-80">
                   {/* Added checks for min/max temp */}
                   <span>Feels: {weatherData.feels_like !== null && weatherData.feels_like !== undefined ? `${Math.round(weatherData.feels_like)}°` : '--'}</span>
                   <span>H: {weatherData.temp_max !== null && weatherData.temp_max !== undefined ? `${Math.round(weatherData.temp_max)}°` : '--'}</span>
                   <span>L: {weatherData.temp_min !== null && weatherData.temp_min !== undefined ? `${Math.round(weatherData.temp_min)}°` : '--'}</span>
                </div>
              </div>
            </div>

            {/* Weather Details Grid */}
            {/* Adjusted styles for detail items */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4 bg-linear-to-br">

               <DetailItem  icon={<LuWind/>} label="Wind" value={weatherData.wind_speed} unit="m/s" />
              
               <DetailItem icon={<LuDroplet/>} label="Humidity" value={weatherData.humidity} unit="%" />
               <DetailItem icon={<LuGauge/>} label="Pressure" value={weatherData.pressure} unit="hPa" />
               <DetailItem icon={<LuEye/>} label="Visibility" value={weatherData.visibility} unit="km" />
               <DetailItem icon={<LuCloud/>} label="Clouds" value={weatherData.clouds} unit="%" />
               {/* Combine Sunrise/Sunset into one card for better grid fit */}
               <div className="bg-linear-to-br from-green-500 to-emerald-600 backdrop-blur-md p-4 rounded-lg text-center flex flex-col justify-between h-full shadow-lg text-white col-span-2 md:col-span-1">
                 <div className="flex justify-around items-center h-full">
                   <div className="text-center">
                     <LuSunrise className="mx-auto text-2xl mb-1 opacity-80" />
                     <p className="font-bold text-lg leading-tight">{weatherData.sunrise ?? '--'}</p>
                     <p className="text-xs opacity-70 uppercase tracking-wide mt-1">Sunrise</p>
                   </div>
                   <div className="text-center">
                     <LuSunset className="mx-auto text-2xl mb-1 opacity-80" />
                     <p className="font-bold text-lg leading-tight">{weatherData.sunset ?? '--'}</p>
                     <p className="text-xs opacity-70 uppercase tracking-wide mt-1">Sunset</p>
                   </div>
                 </div>
               </div>
               {/* Conditionally show rain */}
               {weatherData.rain_1h > 0 && (
                 <DetailItem icon={<LuUmbrella/>} label="Rain (1h)" value={weatherData.rain_1h} unit=" mm" />
               )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default WeatherPage;