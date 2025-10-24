import React from 'react';
import { Link } from 'react-router-dom'; // Button ko link karne ke liye
import { useWeather } from '../Context/WeatherContext';
import { 
  LuScanLine, 
  LuCloudy, 
  LuHeartPulse, // My Crops icon
  LuChevronRight,
  LuLoader
  // LuUserCircle // Community icon
} from 'react-icons/lu';

// --- Naya Component (Community Post) ---
const CommunityPost = ({ name, time, content, imageUrl }) => (
  <div className="bg-white p-4 rounded-lg shadow-md flex space-x-4">
    <img src={imageUrl} alt={name} className="w-12 h-12 rounded-full object-cover" />
    <div className="flex-1">
      <div className="flex items-baseline space-x-2">
        <p className="font-semibold text-gray-800">{name}</p>
        <p className="text-xs text-gray-400">{time}</p>
      </div>
      <p className="text-gray-700 mt-1">{content}</p>
    </div>
  </div>
);

// --- Main Dashboard Component ---
function Dashboard() {
  const { weatherData, isLoading, error, selectedCity } = useWeather();
  return (
    // 'pb-20' (padding-bottom: 20) mobile par BottomNav ke liye jagah banayega
    <main className="flex-1 p-4 md:p-8 bg-gray-50 overflow-y-auto pb-20 md:pb-8">
      
      {/* --- 1. Welcome Message (SS ke hisaab se) --- */}
      <h2 className="text-3xl font-bold text-gray-800 mb-6">
        Namaste, Farmer!
      </h2>

      {/* --- 2. Main Action Card (Hero) --- */}
      <div className="bg-linear-to-r from-green-600 to-green-800
                      text-white p-8 rounded-2xl shadow-xl
                      flex flex-col md:flex-row items-center justify-between mb-8">
        <div>
          <h3 className="text-3xl font-bold mb-2">Patti Scan Karein</h3>
          <p className="text-lg text-green-100 mb-4 md:mb-0">
            Apni fasal ki photo upload karein aur turant bimari ka pata lagayein.
          </p>
        </div>
        {/* Is button ko hum /scan page se link kar denge */}
        <Link 
          to="/scan"
          className="bg-white text-green-700 font-bold 
                     py-3 px-6 rounded-lg shadow-md
                     flex items-center transition-transform duration-200 hover:scale-105"
        >
          <LuScanLine className="mr-2" />
          Abhi Scan Karein
        </Link>
      </div>

      {/* --- 3. Widgets Grid (SS ke hisaab se) --- */}
      {/* Yeh mobile par 1 column aur desktop (md) par 2 column mein dikhega */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

        {/* My Crops Widget */}
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h4 className="text-xl font-semibold text-gray-800 mb-4">Meri Faslein</h4>
          <div className="space-y-3">
            {/* Hum yahaan dummy data daal rahe hain */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-700">Aaloo Khet 1</p>
              <p className="text-sm font-semibold text-green-600">Healthy</p>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-700">Tamatar (Bagicha)</p>
              <p className="text-sm font-semibold text-yellow-600">Needs Water</p>
            </div>
          </div>
          <Link to="/my-crops" className="text-green-600 font-semibold mt-4 inline-flex items-center">
            Sabhi Dekhein <LuChevronRight className="ml-1" />
          </Link>
        </div>
        
        {/* Weather Widget */}
        {/* --- Weather Widget (UPDATED) --- */}
        <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col justify-between">
          <div>
            <h4 className="text-xl font-semibold text-gray-800 mb-4">Aaj Ka Mausam</h4>
            
            {/* Show Loading */}
            {isLoading && (
              <div className="flex items-center text-gray-500">
                <LuLoader className="animate-spin mr-2" /> Loading weather...
              </div>
            )}

            {/* Show Error */}
            {error && !isLoading && (
              <p className="text-red-500 text-sm">Could not load weather for {selectedCity}.</p>
            )}

            {/* Show Weather Data */}
            {weatherData && !isLoading && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <img src={weatherData.icon_url} alt={weatherData.description} className="w-12 h-12 -ml-2" />
                  <div className="ml-2">
                    <p className="text-3xl font-bold text-gray-900">
                      {Math.round(weatherData.temperature)}°C
                    </p>
                    <p className="text-gray-500 capitalize">{weatherData.city} ({weatherData.description})</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Link to full forecast */}
          <Link to="/weather" className="text-green-600 font-semibold mt-4 inline-flex items-center self-start">
            Poora Forecast Dekhein <LuChevronRight className="ml-1" />
          </Link>
        </div>


      </div>

      {/* --- 4. Community Feed (Naya Section, SS ke hisaab se) --- */}
      <div>
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Community Feed</h3>
        <div className="space-y-4">
          {/* Hum yahaan dummy posts daal rahe hain */}
          <CommunityPost 
            name="Rajesh Kumar" 
            time="5 min pehle"
            content="Is saal tamatar ki fasal bahut acchi hui hai! Sarthi AI ka dhanyavaad ilaaj batane ke liye."
            imageUrl="https://via.placeholder.com/150/4CAF50/FFFFFF?text=R"
          />
          <CommunityPost 
            name="Sunita Devi" 
            time="1 ghanta pehle"
            content="Koi gehoon ke liye naye beej (seeds) suggest kar sakta hai?"
            imageUrl="https://via.placeholder.com/150/FFC107/FFFFFF?text=S"
          />
        </div>
      </div>

    </main>
  );
}

export default Dashboard;