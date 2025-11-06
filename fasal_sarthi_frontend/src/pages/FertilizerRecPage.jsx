// src/pages/FertilizerRecPage.jsx
import React, { useState } from "react";
import { useTranslation } from 'react-i18next'; // <-- Naya import
import axios from "axios";
import {
  LuFlaskConical,
  LuLoader,
  LuTriangleAlert as LuAlertTriangle,
  LuSearch,
} from "react-icons/lu";

// API Base URL (Aapke paas pehle se hai)
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// --- Reusable Input Field Component (Translated) ---
const InputField = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "number",
  required = true,
}) => {
  const { t } = useTranslation(); // <-- Hook ko yahaan use karein
  return (
    <div className="flex flex-col">
      <label htmlFor={name} className="text-sm font-medium text-gray-700 mb-1">
        {label} {/* Label props se translate hokar aayega */}
      </label>
      <input
        type={type}
        name={name}
        id={name}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-shadow duration-200 shadow-sm"
        placeholder={t(placeholder)} 
        required={required}
        step={type === "number" ? "any" : undefined}
      />
    </div>
  );
};

// --- Reusable Select Field Component (Translated) ---
const SelectField = ({
  label,
  name,
  value,
  onChange,
  options,
  required = true,
}) => {
  const { t } = useTranslation(); // <-- Hook ko yahaan use karein
  return (
    <div className="flex flex-col">
      <label htmlFor={name} className="text-sm font-medium text-gray-700 mb-1">
        {label} {/* Label props se translate hokar aayega */}
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
          {t('fert_rec_select_placeholder', { label: label })} {/* Placeholder ko translate karein */}
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {t(`fert_rec_option_${option.toLowerCase().replace(/[^a-z0-9]/g, '_')}`, option)} {/* Options ko translate karein */}
          </option>
        ))}
      </select>
    </div>
  );
};

// --- Main Fertilizer Recommendation Page (Translated) ---
function FertilizerRecPage() {
  const { t } = useTranslation(); // <-- Main hook ko yahaan use karein

  // Options matching backend (Inhein translate karne ki zaroorat nahi, yeh values hain)
  const soilTypeOptions = ["Black", "Clayey", "Loamy", "Red", "Sandy"];
  const cropTypeOptions = [
    "Barley", "Cotton", "Ground Nuts", "Maize", "Millets",
    "Oil seeds", "Paddy", "Pulses", "Sugarcane", "Tobacco", "Wheat",
    "coffee", "kidneybeans", "orange", "pomegranate", "rice", "watermelon",
  ];

  // State for form inputs (Ismein koi change nahi)
  const [formData, setFormData] = useState({
    Temparature: "", Humidity: "", Moisture: "",
    Nitrogen: "", Potassium: "", Phosphorous: "",
    Soil_Type: "", Crop_Type: "",
  });

  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Handle input changes (Ismein koi change nahi)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission (Error messages ko translate karein)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);
    setError(null);

    const payload = {
      ...formData,
      Temparature: parseFloat(formData.Temparature),
      Humidity: parseFloat(formData.Humidity),
      Moisture: parseFloat(formData.Moisture),
      Nitrogen: parseFloat(formData.Nitrogen),
      Potassium: parseFloat(formData.Potassium),
      Phosphorous: parseFloat(formData.Phosphorous),
    };

    // Validation for NaN inputs
    if (Object.values(payload).some(v => typeof v === 'number' && isNaN(v))) {
        setError(t('fert_rec_error_invalid_number'));
        setIsLoading(false);
        return;
    }
    // Validation for empty selects
    if (!payload.Soil_Type || !payload.Crop_Type) {
        setError(t('fert_rec_error_select_options'));
        setIsLoading(false);
        return;
    }

    try {
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
        setError(t('fert_rec_error_connection')); // Translated error
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
            {t('fert_rec_page_title')} {/* Page title translate karein */}
          </h2>
          <p className="mt-2 text-sm md:text-base text-gray-600">
            {t('fert_rec_page_subtitle')} {/* Subtitle translate karein */}
          </p>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Left column - image + quick tips (Translated) */}
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
                    {t('fert_rec_image_title')}
                  </h3>
                  <p className="text-sm opacity-90">
                    {t('fert_rec_image_subtitle')}
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
                  <h4 className="font-semibold text-gray-800">{t('fert_rec_tip1_title')}</h4>
                  <p className="text-sm text-gray-600">
                    {t('fert_rec_tip1_desc')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-100 rounded-lg shrink-0">
                  <LuFlaskConical className="text-2xl text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">{t('fert_rec_tip2_title')}</h4>
                  <p className="text-sm text-gray-600">
                    {t('fert_rec_tip2_desc')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <div className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                  <p className="text-xs text-gray-500">{t('fert_rec_note1_title')}</p>
                  <p className="text-sm font-medium text-gray-800">
                    {t('fert_rec_note1_desc')}
                  </p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                  <p className="text-xs text-gray-500">{t('fert_rec_note2_title')}</p>
                  <p className="text-sm font-medium text-gray-800">
                    {t('fert_rec_note2_desc')}
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-400">Image: Unsplash</p>
            </div>
          </div>

          {/* Right column - form (Translated) */}
          <div className="rounded-2xl bg-white/70 backdrop-blur-sm border border-gray-100 p-6 md:p-8 shadow-lg transform transition-all duration-300 hover:shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <p className="text-gray-600">
                {t('fert_rec_form_intro')}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  label={t('fert_rec_label_temperature')}
                  name="Temparature"
                  value={formData.Temparature}
                  onChange={handleChange}
                  placeholder="fert_rec_placeholder_temperature"
                />
                <InputField
                  label={t('fert_rec_label_humidity')}
                  name="Humidity"
                  value={formData.Humidity}
                  onChange={handleChange}
                  placeholder="fert_rec_placeholder_humidity"
                />
                <InputField
                  label={t('fert_rec_label_moisture')}
                  name="Moisture"
                  value={formData.Moisture}
                  onChange={handleChange}
                  placeholder="fert_rec_placeholder_moisture"
                />
                <InputField
                  label={t('fert_rec_label_nitrogen')}
                  name="Nitrogen"
                  value={formData.Nitrogen}
                  onChange={handleChange}
                  placeholder="fert_rec_placeholder_nitrogen"
                />
                <InputField
                  label={t('fert_rec_label_potassium')}
                  name="Potassium"
                  value={formData.Potassium}
                  onChange={handleChange}
                  placeholder="fert_rec_placeholder_potassium"
                />
                <InputField
                  label={t('fert_rec_label_phosphorous')}
                  name="Phosphorous"
                  value={formData.Phosphorous}
                  onChange={handleChange}
                  placeholder="fert_rec_placeholder_phosphorous"
                />
                <SelectField
                  label={t('fert_rec_label_soil_type')}
                  name="Soil_Type"
                  value={formData.Soil_Type}
                  onChange={handleChange}
                  options={soilTypeOptions}
                />
                <SelectField
                  label={t('fert_rec_label_crop_type')}
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
                    <LuFlaskConical className="text-xl" /> {t('fert_rec_submit_button')}
                  </>
                )}
              </button>
            </form>

            {/* result & error live preview (Translated) */}
            <div className="mt-6 space-y-4">
              {error && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex items-start gap-3">
                  <LuAlertTriangle className="text-2xl text-red-500 mt-1" />
                  <div>
                    <p className="text-sm font-semibold text-red-700">{t('fert_rec_error_title')}</p>
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
                      {t('fert_rec_result_title')}
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