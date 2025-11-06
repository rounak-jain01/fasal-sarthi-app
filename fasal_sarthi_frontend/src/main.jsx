import React, { Suspense } from 'react'; // <-- Suspense ko import karein
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { BrowserRouter } from 'react-router-dom';

// Aapke dusre providers (agar hain toh)
import { WeatherProvider } from './Context/WeatherContext'; 
// import { AuthProvider } from './context/AuthContext'; // Agar Auth use kar rahe hain

import './i18n'; // <-- Humari i18n config file ko yahaan import karein

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Suspense component ko add karein translation loading ke liye */}
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-gray-100">
        <p className="text-lg font-medium text-gray-700">Loading...</p>
      </div>
    }>
      <BrowserRouter>
        {/* Aapke baaki Context Providers (Weather, Auth) Suspense ke andar hone chahiye */}
        <WeatherProvider>
          {/* <AuthProvider> */}
            <App />
          {/* </AuthProvider> */}
        </WeatherProvider>
      </BrowserRouter>
    </Suspense>
  </React.StrictMode>,
);