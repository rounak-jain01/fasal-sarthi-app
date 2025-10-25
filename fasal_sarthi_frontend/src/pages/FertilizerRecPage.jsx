import React, { useState } from "react";
import axios from "axios";
import {
  LuFlaskConical,
  LuLoader,
  LuTriangleAlert as LuAlertTriangle,
  LuSearch,
} from "react-icons/lu";
// Add this line below your imports
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
// --- Reusable Input Field Component ---
const InputField = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "number",
  required = true,
}) => (
  <div className="flex flex-col">
    <label htmlFor={name} className="text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <input
      type={type}
      name={name}
      id={name}
      value={value}
      onChange={onChange}
      className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-shadow duration-200 shadow-sm"
      placeholder={placeholder}
      required={required}
      step={type === "number" ? "any" : undefined} // Allow decimals for numbers
    />
  </div>
);

// --- Reusable Select Field Component ---
const SelectField = ({
  label,
  name,
  value,
  onChange,
  options,
  required = true,
}) => (
  <div className="flex flex-col">
    <label htmlFor={name} className="text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <select
      name={name}
      id={name}
      value={value}
      onChange={onChange}
      className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-shadow duration-200 shadow-sm"
      required={required}
    >
      <option value="" disabled>
        Select {label}
      </option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </div>
);

// --- Main Fertilizer Recommendation Page ---
function FertilizerRecPage() {
  // Define options based on your model's training data (from model_columns.joblib)
  // Ensure these exactly match the names used in your backend (after 'Soil_Type_' and 'Crop_Type_')
  const soilTypeOptions = ["Black", "Clayey", "Loamy", "Red", "Sandy"];
  const cropTypeOptions = [
    "Barley",
    "Cotton",
    "Ground Nuts",
    "Maize",
    "Millets",
    "Oil seeds",
    "Paddy",
    "Pulses",
    "Sugarcane",
    "Tobacco",
    "Wheat",
    "coffee",
    "kidneybeans",
    "orange",
    "pomegranate",
    "rice",
    "watermelon", // Add others if your model uses them
  ];

  // State for form inputs
  const [formData, setFormData] = useState({
    Temparature: "", // Match backend key 'Temparature'
    Humidity: "", // Match backend key 'Humidity'
    Moisture: "", // Match backend key 'Moisture'
    Nitrogen: "", // Match backend key 'Nitrogen'
    Potassium: "", // Match backend key 'Potassium'
    Phosphorous: "", // Match backend key 'Phosphorous'
    Soil_Type: "", // Match backend key 'Soil_Type'
    Crop_Type: "", // Match backend key 'Crop_Type'
  });

  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);
    setError(null);

    // Make sure numerical fields are sent as numbers
    const payload = {
      ...formData,
      Temparature: parseFloat(formData.Temparature),
      Humidity: parseFloat(formData.Humidity),
      Moisture: parseFloat(formData.Moisture),
      Nitrogen: parseFloat(formData.Nitrogen),
      Potassium: parseFloat(formData.Potassium),
      Phosphorous: parseFloat(formData.Phosphorous),
    };

    try {
      // Call the backend API
      // Replace the old URL with this:
      const response = await axios.post(
        `${API_BASE_URL}/recommend_fertilizer`,
        payload
      );
      setResult(response.data.recommended_fertilizer);
    } catch (err) {
      console.error("Fertilizer API Error:", err);
      if (err.response && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError("Recommendation failed. Could not connect to the server.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-1 p-4 md:p-8 bg-linear-to-b from-emerald-50 via-white to-amber-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800 tracking-tight">
            Khaad Sujhaav — Fertilizer Recommendation
          </h2>
          <p className="mt-2 text-sm md:text-base text-gray-600">
            Saral aur upyogi sujhaav — apne khet ke liye sahi khaad pata
            lagayein.
          </p>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Left column - image + quick tips */}
          <div className="rounded-2xl overflow-hidden bg-white/60 shadow-md border border-gray-100 flex flex-col">
            <div className="relative h-56 md:h-72 lg:h-full">
              <img
                src="https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1350&q=80"
                alt="Farm field"
                className="w-full h-full object-cover transform transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent flex items-end p-4">
                <div className="text-white">
                  <h3 className="text-lg font-semibold">
                    Smart, Simple, Local
                  </h3>
                  <p className="text-sm opacity-90">
                    Inputs tailored for your crop and soil.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-100 rounded-lg shrink-0">
                  <LuSearch className="text-2xl text-amber-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Fast Results</h4>
                  <p className="text-sm text-gray-600">
                    Fill basic soil & weather info to get a fertilizer
                    suggestion instantly.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-100 rounded-lg shrink-0">
                  <LuFlaskConical className="text-2xl text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Farm Friendly</h4>
                  <p className="text-sm text-gray-600">
                    Clear labels and examples make it easy for farmers of all
                    experience levels.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <div className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                  <p className="text-xs text-gray-500">Tip</p>
                  <p className="text-sm font-medium text-gray-800">
                    Measure moisture after irrigation for best accuracy.
                  </p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                  <p className="text-xs text-gray-500">Note</p>
                  <p className="text-sm font-medium text-gray-800">
                    Use local soil type and crop type for correct suggestions.
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-400">Image: Unsplash</p>
            </div>
          </div>

          {/* Right column - form */}
          <div className="rounded-2xl bg-white/70 backdrop-blur-sm border border-gray-100 p-6 md:p-8 shadow-lg transform transition-all duration-300 hover:shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <p className="text-gray-600">
                Kripya apni khet ki jaankari bharein sahi khaad ka sujhaav paane
                ke liye.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  label="Temperature (°C)"
                  name="Temparature"
                  value={formData.Temparature}
                  onChange={handleChange}
                  placeholder="e.g., 26"
                />
                <InputField
                  label="Humidity (%)"
                  name="Humidity"
                  value={formData.Humidity}
                  onChange={handleChange}
                  placeholder="e.g., 52"
                />
                <InputField
                  label="Soil Moisture (%)"
                  name="Moisture"
                  value={formData.Moisture}
                  onChange={handleChange}
                  placeholder="e.g., 38"
                />
                <InputField
                  label="Nitrogen (N) Content"
                  name="Nitrogen"
                  value={formData.Nitrogen}
                  onChange={handleChange}
                  placeholder="e.g., 37"
                />
                <InputField
                  label="Potassium (K) Content"
                  name="Potassium"
                  value={formData.Potassium}
                  onChange={handleChange}
                  placeholder="e.g., 0"
                />
                <InputField
                  label="Phosphorous (P) Content"
                  name="Phosphorous"
                  value={formData.Phosphorous}
                  onChange={handleChange}
                  placeholder="e.g., 0"
                />
                <SelectField
                  label="Soil Type"
                  name="Soil_Type"
                  value={formData.Soil_Type}
                  onChange={handleChange}
                  options={soilTypeOptions}
                />
                <SelectField
                  label="Crop Type"
                  name="Crop_Type"
                  value={formData.Crop_Type}
                  onChange={handleChange}
                  options={cropTypeOptions}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:scale-[1.02] transition-transform duration-200 flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? (
                  <LuLoader className="animate-spin text-2xl" />
                ) : (
                  <>
                    <LuFlaskConical className="text-xl" /> Find Best Fertilizer
                  </>
                )}
              </button>
            </form>

            {/* result & error live preview below form on mobile and desktop */}
            <div className="mt-6 space-y-4">
              {error && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex items-start gap-3">
                  <LuAlertTriangle className="text-2xl text-red-500 mt-1" />
                  <div>
                    <p className="text-sm font-semibold text-red-700">Error</p>
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                </div>
              )}

              {result && (
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 flex items-center gap-4">
                  <div className="p-3 bg-amber-100 rounded-md">
                    <LuFlaskConical className="text-2xl text-amber-700" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">
                      Recommended Fertilizer
                    </p>
                    <p className="text-lg font-bold text-amber-700 capitalize">
                      {result}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default FertilizerRecPage;
