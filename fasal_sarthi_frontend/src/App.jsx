import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navigate, Link } from 'react-router-dom';

// --- Layout Components ---
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import AppDrawer from './components/AppDrawer';

// --- Page Components ---
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import ScanPage from './pages/ScanPage';
import ChatPage from './pages/ChatPage';
import MyCropsPage from './pages/MyCropsPage';
import CropRecPage from './pages/CropRecPage';
import FertilizerRecPage from './pages/FertilizerRecPage';
import WeatherPage from './pages/WeatherPage';

// --- Helper Components ---
import { LuLoader } from 'react-icons/lu'; // For loading indicator

// --- Main App Layout Component ---
// This component wraps pages that need the Sidebar, Header, BottomNav structure
const MainAppLayout = ({ children }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false); // State to manage mobile drawer

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  return (
    // Main flex container (column on mobile, row on desktop)
    <div className="flex flex-col md:flex-row min-h-screen bg-white relative" 
    
    >
      {/* Sidebar - Visible only on medium screens and up */}
      <Sidebar />
      {/* App Drawer - Visible only on small screens, controlled by state */}
      <AppDrawer isOpen={isDrawerOpen} toggleDrawer={toggleDrawer} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - Always visible */}
        <Header />
        {/* Page Content - Passed as children, takes remaining space */}
        {children}
      </div>

      {/* Bottom Navigation - Visible only on small screens */}
      {/* Pass the toggle function to the "More" button */}
      <BottomNav toggleDrawer={toggleDrawer} />
    </div>
  );
};

// --- App Component (Main Router Setup) ---
function App() {
  // The Router itself is usually in main.jsx, wrapping the <App /> component.
  // App component defines the Routes.
  return (
      <Routes>
        {/* --- Public Routes --- */}
        {/* Landing Page (Home) */}
        <Route path="/" element={<LandingPage />} />

        {/* About Page (Example of a simple public page) */}
        <Route path="/about" element={
            <div className="flex flex-col min-h-screen bg-gray-50 items-center justify-center p-8">
              <h2 className="text-3xl font-bold mb-4">About Fasal Sarthi</h2>
              <p>Information about the Fasal Sarthi project and its goals.</p>
              <Link to="/" className="mt-4 text-green-600 hover:underline">Back to Home</Link>
            </div>
        } />


        {/* --- Public Routes (No Auth Required) --- */}
        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <MainAppLayout>
              <Dashboard />
            </MainAppLayout>
          }
        />

        {/* Scan Crop Page */}
        <Route
          path="/scan"
          element={
            <MainAppLayout>
              <ScanPage />
            </MainAppLayout>
          }
        />

        {/* Chat Page */}
        <Route
          path="/chat"
          element={
            <MainAppLayout>
              <ChatPage />
            </MainAppLayout>
          }
        />

        {/* My Crops Page */}
        <Route
          path="/my-crops"
          element={
            <MainAppLayout>
              {/* <MyCropsPage /> */}
            </MainAppLayout>
          }
        />

        {/* Crop Recommendation Page */}
        <Route
          path="/crop-recommendation"
          element={
            <MainAppLayout>
              <CropRecPage />
            </MainAppLayout>
          }
        />

        {/* Fertilizer Recommendation Page */}
        <Route
          path="/fertilizer-advice"
          element={
            <MainAppLayout>
              <FertilizerRecPage />
            </MainAppLayout>
          }
        />

        {/* Weather Page */}
        <Route
          path="/weather"
          element={
            <MainAppLayout>
              <WeatherPage />
            </MainAppLayout>
          }
        />

        {/* Settings Page (Placeholder) */}
        <Route
          path="/settings"
          element={
            <MainAppLayout>
              <div className="flex-1 p-8 text-center text-gray-600">Settings Page (Coming Soon!)</div>
            </MainAppLayout>
          }
        />

        {/* --- Catch-all Route --- */}
        {/* Redirects any unknown URL back to the landing page */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
  );
}

export default App;