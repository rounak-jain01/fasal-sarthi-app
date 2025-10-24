import React from 'react';
import { Link, useLocation } from 'react-router-dom'; // Naya import
import { 
  LuLayoutDashboard, LuScanLine, LuHeartPulse, LuBot, LuCloudy, LuSettings, LuWheat, LuFlaskConical
} from "react-icons/lu";

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
  return (
    <aside className="hidden  md:flex flex-col w-64 bg-white border-r border-gray-200 shadow-sm">
      <div className="p-5 border-b sticky top-0  border-gray-200">
        <Link to='/'>
        <h1 className="text-2xl font-bold text-green-700 text-center cursor-pointer">
          🌿 Fasal Sarthi
        </h1>
        </Link>
      </div>
      <nav className="grow p-4 mt-15 fixed ">
        <ul>
          <NavItem icon={<LuLayoutDashboard />} to="/dashboard">
            Dashboard
          </NavItem>
          <NavItem icon={<LuScanLine />} to="/scan">
            Crop Disease Detection
          </NavItem>
          {/* <NavItem icon={<LuHeartPulse />} to="/my-crops">
            My Crops
          </NavItem> */}
          <NavItem icon={<LuWheat />} to="/crop-recommendation">
            Crop Recommendation
          </NavItem>

          <NavItem icon={<LuFlaskConical />} to="/fertilizer-advice">
            Fertilizer Advice
          </NavItem>
          
          <NavItem icon={<LuCloudy />} to="/weather">
            Weather
          </NavItem>
          <NavItem icon={<LuBot />} to="/chat">
            Sarthi AI
          </NavItem>
          <li className="mt-10 border-t border-gray-200"></li>
          <NavItem icon={<LuSettings />} to="/settings">
            Settings
          </NavItem>
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;