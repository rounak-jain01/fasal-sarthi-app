import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // <-- 1. Naya import
import {
  LuX, // Close button
  LuLayoutDashboard, LuScanLine, LuHeartPulse, LuBot, // Updated: LuHouse ki jagah LuHeartPulse
  LuWheat, LuFlaskConical, LuCloudy, LuSettings,LuHouse as LuHome // <-- LuHome add kiya
} from 'react-icons/lu';

// Drawer Item Component (Ismein koi change nahi hai)
const DrawerItem = ({ icon, children, to, onClick }) => {
  const location = useLocation();
  // Update active check to handle '/' route specifically
  const isActive = (to === '/') ? location.pathname === to : location.pathname.startsWith(to);

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
  const { t } = useTranslation(); // <-- 2. Hook ka istemaal karein

  return (
    <>
      {/* Overlay (Ismein koi change nahi) */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        onClick={toggleDrawer} // Close drawer when clicking overlay
      ></div>

      {/* Drawer Panel (Translated) */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-72 bg-white shadow-xl z-50
          transform transition-transform duration-300 ease-in-out md:hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Drawer Header (Translated) */}
        <div className="p-5 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-green-700">{t('drawer_all_features')}</h2>
          <button
            onClick={toggleDrawer}
            className="text-gray-500 hover:text-gray-800 p-1"
            aria-label="Close menu"
          >
            <LuX size={24} />
          </button>
        </div>

        {/* Navigation List (Translated) */}
        <nav className="p-4 overflow-y-auto h-[calc(100vh-73px)]"> {/* Added scroll for many items */}
          <ul>
            {/* 3. Sabhi hardcoded text ko t() function se translate karein */}
            <DrawerItem icon={<LuHome />} to="/" onClick={toggleDrawer}>{t('nav_home_landing')}</DrawerItem>
            <DrawerItem icon={<LuLayoutDashboard />} to="/dashboard" onClick={toggleDrawer}>{t('nav_dashboard')}</DrawerItem>
            <DrawerItem icon={<LuScanLine />} to="/scan" onClick={toggleDrawer}>{t('nav_scan_crop')}</DrawerItem>
            {/* <DrawerItem icon={<LuHeartPulse />} to="/my-crops" onClick={toggleDrawer}>{t('nav_my_crops')}</DrawerItem> */}
            <DrawerItem icon={<LuWheat />} to="/crop-recommendation" onClick={toggleDrawer}>{t('nav_recommend_crop')}</DrawerItem>
            <DrawerItem icon={<LuFlaskConical />} to="/fertilizer-advice" onClick={toggleDrawer}>{t('nav_recommend_fertilizer')}</DrawerItem>
            <DrawerItem icon={<LuCloudy />} to="/weather" onClick={toggleDrawer}>{t('nav_weather')}</DrawerItem>
            <DrawerItem icon={<LuBot />} to="/chat" onClick={toggleDrawer}>{t('nav_chat')}</DrawerItem>
            
            {/* Divider */}
            <li className="mt-6 border-t border-gray-200"></li>
            <DrawerItem icon={<LuSettings />} to="/settings" onClick={toggleDrawer}>{t('nav_settings')}</DrawerItem>
          </ul>
        </nav>
      </aside>
    </>
  );
}

export default AppDrawer;