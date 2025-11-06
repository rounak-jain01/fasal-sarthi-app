import React from 'react';
import { useTranslation } from 'react-i18next'; // <-- 1. Import karein
import LanguageSwitcher from './LanguageSwitcher'; // <-- 2. Naya component import karein
import { LuBell, LuUser } from "react-icons/lu"; 
// Agar aap AuthContext use nahi kar rahe hain toh 'useAuth' hata dein
// import { useAuth } from '../context/AuthContext'; 

function Header() {
  // --- 3. Hook ka istemaal karein ---
  const { t } = useTranslation(); 
  
  // Agar aap AuthContext use nahi kar rahe hain, toh 'displayName' manually set karein
  // const { userProfile } = useAuth();
  // const displayName = userProfile?.name || 'Farmer';
  const displayName = 'Farmer'; // Ya jo bhi default naam aap dikhana chahte hain

  return (
    <header className="h-[70px] bg-white border-b border-gray-200 
                     flex items-center justify-between px-4 md:px-8 shadow-sm
                     z-10">
      
      {/* Greeting */}
      <div>
        <h2 className="text-xl font-bold text-gray-800">
          {/* 4. Text ko 't' function se replace karein */}
          {t('welcomeMessage', { name: displayName })}
        </h2>
      </div>

      {/* User Profile aur Language Switcher */}
      <div className="flex items-center space-x-2 md:space-x-4">
        <button className="p-2 text-gray-600 hover:text-gray-900">
          <LuBell size={24} />
        </button>
        <button>
          <LuUser size={32} className="text-gray-600" />
        </button>
        
        {/* --- 5. Naya component yahaan add karein --- */}
        <LanguageSwitcher />

      </div>
    </header>
  );
}

export default Header;