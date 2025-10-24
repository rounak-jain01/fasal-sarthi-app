import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LuX, // Close button
  LuLayoutDashboard, LuScanLine, LuHouse, LuBot,
  LuWheat, LuFlaskConical, LuCloudy, LuSettings // All features
} from 'react-icons/lu';

// Drawer Item Component
const DrawerItem = ({ icon, children, to, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      onClick={onClick} // To close drawer on click
      className={`
        flex items-center p-3 my-1 rounded-lg cursor-pointer text-base
        transition-colors duration-200
        ${isActive
          ? 'bg-green-100 text-green-700 font-semibold'
          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
        }
      `}
    >
      <span className="mr-4 text-xl text-green-600">{icon}</span>
      <span className="font-medium">{children}</span>
    </Link>
  );
};


function AppDrawer({ isOpen, toggleDrawer }) {
  return (
    <>
      {/* Overlay (dims background when drawer is open) */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        onClick={toggleDrawer} // Close drawer when clicking overlay
      ></div>

      {/* Drawer Panel */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-72 bg-white shadow-xl z-50
          transform transition-transform duration-300 ease-in-out md:hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-green-700">All Features</h2>
          <button
            onClick={toggleDrawer}
            className="text-gray-500 hover:text-gray-800 p-1"
            aria-label="Close menu"
          >
            <LuX size={24} />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="p-4">
          <ul>
            <DrawerItem icon={<LuHouse />} to="/" onClick={toggleDrawer}>Home</DrawerItem>
            <DrawerItem icon={<LuLayoutDashboard />} to="/dashboard" onClick={toggleDrawer}>Dashboard</DrawerItem>
            <DrawerItem icon={<LuScanLine />} to="/scan" onClick={toggleDrawer}>Scan Crop</DrawerItem>
            {/* <DrawerItem icon={<LuHeartPulse />} to="/my-crops" onClick={toggleDrawer}>My Crops</DrawerItem> */}
            <DrawerItem icon={<LuWheat />} to="/crop-recommendation" onClick={toggleDrawer}>Crop Recommendation</DrawerItem>
            <DrawerItem icon={<LuFlaskConical />} to="/fertilizer-advice" onClick={toggleDrawer}>Fertilizer Advice</DrawerItem>
            <DrawerItem icon={<LuCloudy />} to="/weather" onClick={toggleDrawer}>Weather</DrawerItem>
            <DrawerItem icon={<LuBot />} to="/chat" onClick={toggleDrawer}>Sarthi AI Chatbot</DrawerItem>
            {/* Divider */}
            <li className="mt-6 border-t border-gray-200"></li>
            <DrawerItem icon={<LuSettings />} to="/settings" onClick={toggleDrawer}>Settings</DrawerItem>
            {/* Add Logout or other items here */}
          </ul>
        </nav>
      </aside>
    </>
  );
}

export default AppDrawer;