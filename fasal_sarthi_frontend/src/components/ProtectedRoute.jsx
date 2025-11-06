import React from 'react';
// [--- FIX ---]
// 'useSession' ki jagah 'useSessionContext' ka istemaal karein
// Yeh humein 'isLoading' state deta hai
import { useSessionContext } from '@supabase/auth-helpers-react';
// [--- END FIX ---]
import { Navigate } from 'react-router-dom';
import { LuLoader } from 'react-icons/lu';

function ProtectedRoute({ children }) {
  // [--- FIX ---]
  // Hum 'session' aur 'isLoading' dono ko nikaalenge
  // 'isLoading' tab 'true' hota hai jab Supabase local storage se token padh raha hota hai
  const { session, isLoading } = useSessionContext();
  // [--- END FIX ---]

  // [--- FIX ---]
  // Kadam 1: Check karein ki kya Supabase abhi bhi load kar raha hai
  if (isLoading) {
    // Jab tak 'isLoading' true hai, hum spinner dikhayenge aur intezaar karenge
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-100">
        <LuLoader className="animate-spin text-4xl text-green-600" />
      </div>
    );
  }
  // [--- END FIX ---]

  // Kadam 2: Agar loading poori ho chuki hai (isLoading = false), 
  // aur session 'null' hai (yaani user logged-in nahi hai)
  if (!session) {
    // User ko seedha /login page par bhej do
    return <Navigate to="/login" replace />;
  }

  // Kadam 3: Agar loading poori ho chuki hai aur session hai, toh children dikhayein
  return children;
}

export default ProtectedRoute;