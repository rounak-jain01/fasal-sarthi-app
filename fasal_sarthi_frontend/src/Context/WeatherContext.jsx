import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";
// Add this line below your imports
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Create the context
const WeatherContext = createContext();

// Create a provider component
export const WeatherProvider = ({ children }) => {
  const [selectedCity, setSelectedCity] = useState("Bhopal"); // Default city
  const [weatherData, setWeatherData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to fetch weather data (can be called from anywhere)
  const fetchWeather = async (cityOrCoords) => {
    setIsLoading(true);
    setWeatherData(null);
    setError(null);
    let payload;
    let isCoords = false;

    if (typeof cityOrCoords === "string") {
      payload = { city: cityOrCoords };
      setSelectedCity(cityOrCoords); // Update selected city name
    } else if (cityOrCoords && cityOrCoords.lat && cityOrCoords.lon) {
      payload = { lat: cityOrCoords.lat, lon: cityOrCoords.lon };
      isCoords = true;
    } else {
      setError("Invalid input for fetching weather.");
      setIsLoading(false);
      return;
    }

    try {
      // Replace the old URL with this:
      const response = await axios.post(`${API_BASE_URL}/get_weather`, payload);
      setWeatherData(response.data);
      // If fetched via coords, update the city name from the response
      if (isCoords) {
        setSelectedCity(response.data.city);
      }
    } catch (err) {
      console.error("Weather fetch error:", err);
      const errorMessage =
        err.response?.data?.error || "Failed to fetch weather data.";
      setError(
        errorMessage.replace(
          "city not found",
          "City not found. Check spelling."
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch weather for the default city on initial load
  useEffect(() => {
    fetchWeather(selectedCity);
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <WeatherContext.Provider
      value={{ selectedCity, weatherData, isLoading, error, fetchWeather }}
    >
      {children}
    </WeatherContext.Provider>
  );
};

// Custom hook to use the weather context easily
export const useWeather = () => {
  return useContext(WeatherContext);
};
