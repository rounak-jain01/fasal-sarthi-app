// src/components/Header.jsx
import React from 'react';
import { LuBell, LuUser } from "react-icons/lu";

function Header() {
  return (
    <header className="h-[70px] w-full bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 shadow-sm sticky top-0 z-50">
      <div>
        <h2 className="text-lg md:text-xl font-bold text-gray-800">
          Welcome to Fasal Sarthi
        </h2>
      </div>
      <div className="flex items-center space-x-3 md:space-x-4">
        <button className="p-2 text-gray-600 hover:text-gray-900 relative">
          <LuBell size={22} />
        </button>
        <button className="p-1">
          <LuUser size={26} className="text-gray-600" />
        </button>
      </div>
    </header>
  );
}

export default Header;