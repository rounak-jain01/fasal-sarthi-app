import React from 'react';
import { Link, useLocation } from 'react-router-dom'; // Naya import
import { 
  LuLayoutDashboard, LuScanLine, LuHeartPulse, LuBot, LuCloudy, LuSettings, LuWheat, LuFlaskConical
} from "react-icons/lu";
import { useTranslation } from 'react-i18next'; // <-- Naya import

// NavItem component
const NavItem = ({ icon, children, to }) => {
  const location = useLocation(); // Yeh batata hai ki hum abhi kis URL par hain
  const isActive = location.pathname === to;

  return (
    // 'li' ko 'Link' se badal denge
    <Link to={to} className={`
      flex items-center p-3 my-1 rounded-lg cursor-pointer
      transition-colors duration-200
      ${isActive
        ? 'bg-green-100 text-green-700 font-semibold'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }
    `}>
      <span className="mr-3 text-xl text-green-600">{icon}</span>
      <span className="font-medium">{children}</span>
    </Link>
  );
};

function Sidebar() {
  const { t } = useTranslation(); // <-- useTranslation hook ka istemaal karein
  return (
    <aside className="hidden  md:flex flex-col w-64 bg-white border-r border-gray-200 shadow-sm">
      <div className="p-5 border-b sticky top-0  border-gray-200">
        <Link to='/'>
        <h1 className="text-2xl font-bold text-green-700 text-center cursor-pointer">
          🌿 {t('header_title')}
        </h1>
        </Link>
      </div>
      <nav className="grow p-4 mt-15 fixed ">
        <ul>
          <NavItem icon={<LuLayoutDashboard />} to="/dashboard">
            {t('nav_dashboard')}
          </NavItem>
          <NavItem icon={<LuScanLine />} to="/scan">
            {t('nav_scan_crop')}
          </NavItem>
          {/* <NavItem icon={<LuHeartPulse />} to="/my-crops">
            {t('nav_my_crops')}
          </NavItem> */}
          <NavItem icon={<LuWheat />} to="/crop-recommendation">
            {t('nav_recommend_crop')}
          </NavItem>

          <NavItem icon={<LuFlaskConical />} to="/fertilizer-advice">
            {t('nav_recommend_fertilizer')}
          </NavItem>
          
          <NavItem icon={<LuCloudy />} to="/weather">
            {t('nav_weather')}
          </NavItem>
          <NavItem icon={<LuBot />} to="/chat">
            {t('nav_chat')}
          </NavItem>
          <li className="mt-10 border-t border-gray-200"></li>
          <NavItem icon={<LuSettings />} to="/settings">
            {t('nav_settings')}
          </NavItem>
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;