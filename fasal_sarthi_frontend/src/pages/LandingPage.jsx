import React from 'react';
import { Link } from 'react-router-dom'; // Routing ke liye

// Icons (optional, but makes it attractive)
import { 
  LuLeaf, LuWheat, LuFlaskConical, 
  LuCloudRain, LuMessageSquare, LuUsers,
  LuGithub // Developer section ke liye
} from 'react-icons/lu';

// Temporary developer images (replace with actual paths later)
const developerImages = [
  'https://via.placeholder.com/150/1C6E40/FFFFFF?text=Dev1', // Green tint
  'https://via.placeholder.com/150/2C884F/FFFFFF?text=Dev2', // Slightly darker green
  'https://via.placeholder.com/150/3DA263/FFFFFF?text=Dev3', // Lighter green
  'https://via.placeholder.com/150/4EB677/FFFFFF?text=Dev4', // Even lighter green
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      {/* Navbar (Simple for Landing Page) */}
      <nav className="p-4 bg-white shadow-sm flex justify-between items-center">
        <h1 className="text-2xl font-bold text-green-700">Fasal Sarthi</h1>
        <Link to="/login" className="text-green-600 hover:text-green-800 text-sm font-semibold">Login</Link>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-linear-to-r from-green-600 to-emerald-700 text-white py-20 md:py-32 text-center overflow-hidden">
        {/* Background blobs for modern look */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-green-500 opacity-20 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500 opacity-20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-lime-500 opacity-20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4">
          <h2 className="text-4xl md:text-6xl font-extrabold leading-tight mb-4">
            Your Smart Farming Assistant
          </h2>
          <p className="text-lg md:text-xl font-light opacity-90 mb-8">
            AI-powered crop disease detection, intelligent recommendations, and real-time agricultural guidance for farmers.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
             {/* --- UPDATED "Get Started" Link --- */}
            <Link to="/dashboard" // Use the dynamic link
               className="bg-white text-green-700 hover:bg-gray-100 font-bold py-3 px-8 rounded-full shadow-lg transition-all duration-300 w-full sm:w-auto"
             >
               Get Started
             </Link>
             {/* Learn More Button */}
             <Link to="/about" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-green-700 font-bold py-3 px-8 rounded-full shadow-lg transition-all duration-300 w-full sm:w-auto">
               Learn More
             </Link>
          </div>
        </div>
      </section>

      {/* Core Services Section */}
      <section className="py-16 md:py-24 bg-gray-100 text-center px-4">
        <h3 className="text-3xl md:text-4xl font-bold mb-12 text-gray-800">Core Services</h3>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Service Card 1 */}
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
            <LuLeaf className="text-5xl text-green-600 mx-auto mb-4" />
            <h4 className="text-xl font-bold mb-2">Disease Detection</h4>
            <p className="text-gray-600 mb-4">Upload crop photos for instant AI-powered disease identification and treatment recommendations.</p>
            <Link to="/scan" className="text-green-600 hover:text-green-800 font-semibold flex items-center justify-center">
              Analyze Crop <span className="ml-1 text-lg">›</span>
            </Link>
          </div>
          {/* Service Card 2 */}
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
            <LuWheat className="text-5xl text-green-600 mx-auto mb-4" />
            <h4 className="text-xl font-bold mb-2">Crop Recommendation</h4>
            <p className="text-gray-600 mb-4">Get smart crop suggestions based on soil data, weather, and market trends.</p>
            <Link to="/crop-recommendation" className="text-green-600 hover:text-green-800 font-semibold flex items-center justify-center">
              Get Recommendations <span className="ml-1 text-lg">›</span>
            </Link>
          </div>
          {/* Service Card 3 */}
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
            <LuFlaskConical className="text-5xl text-green-600 mx-auto mb-4" />
            <h4 className="text-xl font-bold mb-2">Fertilizer Advice</h4>
            <p className="text-gray-600 mb-4">Receive precise fertilizer recommendations and application schedules.</p>
            <Link to="/fertilizer-advice" className="text-green-600 hover:text-green-800 font-semibold flex items-center justify-center">
              Get Fertilizer Plan <span className="ml-1 text-lg">›</span>
            </Link>
          </div>
        </div>
      </section>

      {/* More Features Section */}
      <section className="py-16 md:py-24 bg-gray-50 text-center px-4">
        <h3 className="text-3xl md:text-4xl font-bold mb-12 text-gray-800">More Features</h3>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature Card 1 */}
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
            <LuCloudRain className="text-5xl text-blue-500 mx-auto mb-4" />
            <h4 className="text-xl font-bold mb-2">Weather Updates</h4>
            <p className="text-gray-600 mb-4">Real-time weather forecasts and farming alerts.</p>
          </div>
          {/* Feature Card 2 */}
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
            <LuMessageSquare className="text-5xl text-purple-500 mx-auto mb-4" />
            <h4 className="text-xl font-bold mb-2">AI Chatbot</h4>
            <p className="text-gray-600 mb-4">24/7 agricultural guidance in your language.</p>
            <Link to="/chat" className="text-purple-600 hover:text-purple-800 font-semibold flex items-center justify-center">
              Talk to Sarthi <span className="ml-1 text-lg">›</span>
            </Link>
          </div>
          {/* Feature Card 3 */}
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
            <LuUsers className="text-5xl text-orange-500 mx-auto mb-4" />
            <h4 className="text-xl font-bold mb-2">Community</h4>
            <p className="text-gray-600 mb-4">Connect with farmers and share insights.</p>
          </div>
        </div>
      </section>

      {/* Know the Developer Section */}
      <section className="py-16 md:py-24 bg-green-50 text-center px-4">
        <h3 className="text-3xl md:text-4xl font-bold mb-12 text-gray-800">Meet Our Team</h3>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Developer 1 */}
          <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
            <img src='./src/assests/Lakshya.jpg' alt="Developer 1" className="w-32 h-32 rounded-full object-cover mb-4 ring-4 ring-green-300" />
            <h4 className="text-xl font-bold mb-1">Lakshya Saxena</h4>
            <p className="text-green-600 font-medium mb-2">Data Scientist & Backend Developer</p>
            <p className="text-gray-600 text-sm">Responsible for dataset curation, developed robust AI integration for disease detection and chatbot.</p>
            <a href="/" target='_blank'  className="mt-3 text-gray-500 hover:text-gray-700"><LuGithub className="inline-block mr-1" /> GitHub</a>
          </div>
          {/* Developer 2 */}
          <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
            <img src='./src/assests/Rounak_Jain.jpg' alt="Developer 2" className="w-32 h-32 rounded-full object-cover mb-4 ring-4 ring-green-300" />
            <h4 className="text-xl font-bold mb-1">Rounak Jain</h4>
            <p className="text-green-600 font-medium mb-2">Project Lead And Model Trainer</p>
            <p className="text-gray-600 text-sm">Orchestrated the entire project, model training, and performance optimization for disease detection.</p>
            <a href="/" target='_blank' className="mt-3 text-gray-500 hover:text-gray-700"><LuGithub className="inline-block mr-1" /> GitHub</a>
          </div>
          {/* Developer 3 */}
          <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
            <img src='./src/assests/Shivam.jpg' alt="Developer 3" className="w-32 h-32 rounded-full object-cover mb-4 ring-4 ring-green-300" />
            <h4 className="text-xl font-bold mb-1">Shivam Kahar</h4>
            <p className="text-green-600 font-medium mb-2">Frontend And UI/UX Specialist</p>
            <p className="text-gray-600 text-sm">Designed and implemented the intuitive user interface, focusing on mobile-first responsiveness.</p>
            <a href="#" target='_blank' className="mt-3 text-gray-500 hover:text-gray-700"><LuGithub className="inline-block mr-1" /> GitHub</a>
          </div>
          {/* Developer 4 */}
          <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
            <img src='./src/assests/Priyani.jpg' alt="Developer 4" className="w-32 h-32 rounded-full object-cover mb-4 ring-4 ring-green-300" />
            <h4 className="text-xl font-bold mb-1">Priyani Rathod</h4>
            <p className="text-green-600 font-medium mb-2">Database & Cloud Deployment</p>
            <p className="text-gray-600 text-sm">Managed cloud infrastructure, database setup, and ensured seamless application deployment.</p>
            <a href="#" target='_blank' className="mt-3 text-gray-500 hover:text-gray-700"><LuGithub className="inline-block mr-1" /> GitHub</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white p-8 text-center text-sm">
        <p>&copy; 2025 Fasal Sarthi. Empowering Farmers with AI.</p>
      </footer>

      

    </div>
  );
}

export default LandingPage;