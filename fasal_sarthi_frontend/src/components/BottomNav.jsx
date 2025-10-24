import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LuLayoutDashboard, LuScanLine, LuWheat, LuMenu } from 'react-icons/lu'; // Use LuMenu for 'More'

// NavButton Component (Keep this as is or slightly adjust styling if needed)
const NavButton = ({ icon, label, to, onClick }) => {
  const location = useLocation();
  const isActive = to && (location.pathname === to || (to !== '/' && location.pathname.startsWith(to)));

  // If 'to' is provided, render a Link. If 'onClick' is provided, render a button.
  const Tag = to ? Link : 'button';

  return (
    <Tag
      to={to} // Only used if Tag is Link
      onClick={onClick} // Only used if Tag is button
      type={!to ? 'button' : undefined} // Set type if it's a button
      className={`
        flex flex-col items-center justify-center w-full pt-1 pb-1
        transition-colors duration-200 group focus:outline-none focus:ring-1 focus:ring-green-400 rounded-md
        ${isActive
          ? 'text-green-600'
          : 'text-gray-500 hover:text-green-500'}
      `}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className={`text-2xl mb-0.5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
        {icon}
      </span>
      <span className={`text-[11px] font-medium ${isActive ? 'font-semibold' : ''}`}>
        {label}
      </span>
    </Tag>
  );
};

// --- Main BottomNav Component (Updated) ---
// It now needs a way to open the drawer, so we pass 'toggleDrawer' as a prop
function BottomNav({ toggleDrawer }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0
                   bg-white/90 backdrop-blur-sm border-t border-gray-200
                   flex justify-around items-center h-16 shadow-up z-50">

      {/* Core Features */}
      <NavButton icon={<LuLayoutDashboard />} label="Home" to="/dashboard" />
      <NavButton icon={<LuScanLine />} label="Disease Detection" to="/scan" />
      <NavButton icon={<LuWheat />} label="Recommened" to="/crop-recommendation" />

      {/* "More" Button - Triggers the drawer */}
      <NavButton icon={<LuMenu />} label="More" onClick={toggleDrawer} />

    </nav>
  );
}

export default BottomNav;