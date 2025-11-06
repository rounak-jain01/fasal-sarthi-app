import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { WeatherProvider } from './Context/WeatherContext';
import './i18n'; // i18n config file

// [--- FIX ---]
// Supabase client ko alag file se import karein
import { supabaseClient } from './lib/supabaseClient'; 
// Purane imports (createClient) hata diye
import { SessionContextProvider } from '@supabase/auth-helpers-react';
// [--- END FIX ---]

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-gray-100">
        <p className="text-lg font-medium text-gray-700">Loading...</p>
      </div>
    }>
      <BrowserRouter>
        {/* [--- FIX ---] */}
        {/* Ab hum imported client ko yahaan pass kar rahe hain */}
        <SessionContextProvider supabaseClient={supabaseClient}>
          <WeatherProvider>
            <App />
          </WeatherProvider>
        </SessionContextProvider>
        {/* [--- END FIX ---] */}
      </BrowserRouter>
    </Suspense>
  </React.StrictMode>,
);

// [--- FIX ---]
// Neeche se export { supabaseClient } waali line HATA di gayi hai.
// [--- END FIX ---]