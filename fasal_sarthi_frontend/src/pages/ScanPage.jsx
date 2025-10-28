import React, { useState, useCallback, useRef, Fragment } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import {
  LuCloudUpload,
  LuFileImage,
  LuX,
  LuLoader,
  LuTriangleAlert as LuAlertTriangle,
  LuSparkles,
  LuScanLine,
  LuCheck,
  LuCamera, // Naya Camera Icon
} from "react-icons/lu";
// Add this line below your imports
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// --- 1. Result Display Component (Refined) ---
// Is component mein Scan Result aur Cure (ilaaj) donon hain
const ResultDisplay = ({ resultData, cureData, onGetCure, isCureLoading }) => {
  if (!resultData) return null; // Agar result nahi hai toh kuch na dikhayein

  const { predicted_disease, confidence } = resultData;
  const confidenceValue = parseFloat(confidence);
  let confidenceColor = "text-green-600";
  if (confidenceValue < 80) confidenceColor = "text-yellow-600";
  if (confidenceValue < 50) confidenceColor = "text-red-600";

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg animate-fadeIn border border-gray-200">
      <div className="flex items-center mb-4">
        <LuCheck className="text-3xl text-green-600 mr-3" />
        <h3 className="text-2xl font-bold text-gray-800">Scan Result</h3>
      </div>

      {/* Result Details */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-500">Predicted Disease:</p>
        <p className="text-xl font-semibold text-green-700">
          {predicted_disease.replace(/_/g, " ")}
        </p>
      </div>

      <div className="mb-6">
        <p className="text-sm font-medium text-gray-500">Confidence:</p>
        <p className={`text-xl font-semibold ${confidenceColor}`}>
          {confidence}
        </p>
      </div>

      {/* Cure Section Divider */}
      <hr className="my-6 border-gray-200" />

      {/* Cure Button ya Loading ya Result */}
      {!cureData && !isCureLoading && (
        <button
          onClick={onGetCure}
          className="w-full bg-linear-to-r from-green-500 to-emerald-600 text-white font-bold py-3 px-6 rounded-lg shadow-md flex items-center justify-center transition-transform duration-200 hover:scale-105"
        >
          <LuSparkles className="mr-2" /> Sarthi AI se Ilaaj Poochein
        </button>
      )}

      {isCureLoading && (
        <div className="flex items-center justify-center p-4 rounded-lg bg-gray-50 border">
          <LuLoader className="animate-spin text-2xl text-green-600" />
          <p className="ml-3 text-gray-600">
            Sarthi AI se ilaaj poochh rahe hain...
          </p>
        </div>
      )}

      {cureData && (
        <div className="animate-fadeIn">
          <div className="flex items-center mb-3">
            <LuSparkles className="text-xl text-green-600 mr-2" />
            <h4 className="text-lg font-semibold text-gray-800">
              Sarthi AI ka Sujhaav:
            </h4>
          </div>
          <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-2 prose-li:my-1 text-gray-700">
            <ReactMarkdown>{cureData}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

// --- 2. Error Card Component (Minor Style Update) ---
const ErrorCard = ({ message }) => (
  <div className="bg-red-50 p-6 rounded-2xl shadow-lg border border-red-200 animate-fadeIn">
    <div className="flex items-center">
      <LuAlertTriangle className="text-3xl text-red-500 mr-4 shrink-0" />
      <div>
        <h3 className="text-xl font-bold text-red-700">
          Oops! Something Went Wrong!!!
        </h3>
        <p className="text-red-600 mt-1">{message}</p>
      </div>
    </div>
  </div>
);

// --- 3. Main Scan Page Component (HEAVILY Updated) ---
function ScanPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoadingScan, setIsLoadingScan] = useState(false); // Renamed from isLoading
  const [cure, setCure] = useState(null);
  const [isCureLoading, setIsCureLoading] = useState(false);

  // Ref for hidden file inputs
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Function to handle file selection (from drop, browse, or camera)
  const handleFileChange = (file) => {
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setError(null);
      setCure(null);
    } else {
      setError("Please upload a valid image file (JPG, PNG, JPEG).");
      handleClearFile(); // Clear any previous state if invalid file
    }
  };

  // Dropzone setup
  const onDrop = useCallback((acceptedFiles) => {
    handleFileChange(acceptedFiles[0]);
  }, []);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    open: openFileDialog,
  } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [], "image/png": [], "image/jpg": [] },
    multiple: false,
    noClick: true, // Disable clicking on dropzone itself
    noKeyboard: true,
  });

  // Function to trigger camera input
  const triggerCameraInput = () => {
    cameraInputRef.current?.click();
  };

  // Function to trigger file browse input
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // File ko clear karne ke liye
  const handleClearFile = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setCure(null);
    // Reset file input values
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  // --- API CALL 1: Start Scan ---
  const handleSubmitScan = async () => {
    if (!selectedFile) return;
    setIsLoadingScan(true);
    setResult(null);
    setError(null);
    setCure(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      // Replace the old URL with this:
      const response = await axios.post(
        `${API_BASE_URL}/predict_disease`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setResult(response.data);
    } catch (err) {
      console.error(err);
      setError(
        "Scan failed. Server se connection nahi ho paa raha hai. (Kya backend server chal raha hai?)"
      );
    } finally {
      setIsLoadingScan(false);
    }
  };

  // --- API CALL 2: Get Cure ---
  const handleGetCure = async () => {
    if (!result || !result.predicted_disease) return;
    setIsCureLoading(true);
    // Do not clear cure or error here, just fetch
    // setCure(null);
    // setError(null); // Keep previous scan errors if any

    const diseaseName = result.predicted_disease.replace(/_/g, " ");
    const prompt = `Meri fasal ko ${diseaseName} ho gaya hai. Kripya iska ilaaj (cure) aur rokthaam (prevention) ke upaay batao. Jawaab points mein dena response only in hindi.`;

    try {
      // Replace the old URL with this:
      const response = await axios.post(`${API_BASE_URL}/sarthi_ai_chat`, {
        message: prompt,
      });
      setCure(response.data.response);
    } catch (err) {
      console.error(err);
      // Set a specific error for cure fetching
      setError(
        "Sarthi AI se ilaaj poochhne mein error hua. Kripya dobara try karein."
      );
      // Clear cure if fetching failed
      setCure(null);
    } finally {
      setIsCureLoading(false);
    }
  };

  // --- Main Return ---
  // --- Main Return (Updated Layout) ---
  return (
    <main className="flex-1 p-4 md:p-8 bg-linear-to-b from-green-50 to-emerald-50 overflow-y-auto pb-20 md:pb-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center md:text-left">
        Fasal Scan Karein
      </h2>
      {/* Responsive Grid: 1 column on mobile, 2 on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* --- Left Column (Upload/Preview/Scan Button/Basic Result) --- */}
        <div className="bg-white overflow-y-auto lg:max-h-[460px] p-6 md:p-8 rounded-2xl shadow-xl border border-gray-200 space-y-6 ">
          {/* Step 1: Upload (Only shows if no file selected) */}
          {!selectedFile && (
            <Fragment>
              <h3 className="text-xl font-semibold text-gray-700 mb-4 text-center">
                1. Photo Upload Karein
              </h3>
              {/* Dropzone Area (Same as before) */}
              <div
                {...getRootProps()}
                className={`border-4 border-dashed rounded-lg p-8 md:p-12 text-center transition-colors mb-4 ${
                  isDragActive
                    ? "border-green-500 bg-green-50"
                    : "border-gray-300 bg-gray-50"
                }`}
              >
                {/* ... (Hidden inputs and Dropzone content) ... */}
                <input {...getInputProps()} />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleFileChange(e.target.files[0])}
                  accept="image/jpeg,image/png,image/jpg"
                  className="hidden"
                />
                <input
                  type="file"
                  ref={cameraInputRef}
                  onChange={(e) => handleFileChange(e.target.files[0])}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                />
                <LuCloudUpload className="mx-auto text-5xl text-gray-400 mb-3" />
                <p className="text-lg text-gray-600 font-medium">
                  Photo ko yahaan drag karein
                </p>
                <p className="text-gray-500 my-2">ya</p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <button
                    onClick={triggerFileInput}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md flex items-center justify-center transition-transform duration-200 hover:scale-105"
                  >
                    <LuFileImage className="mr-2" /> Browse File
                  </button>
                  <button
                    onClick={triggerCameraInput}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-md flex items-center justify-center transition-transform duration-200 hover:scale-105"
                  >
                    <LuCamera className="mr-2" /> Use Camera
                  </button>
                </div>
                <p className="mt-4 text-xs text-gray-500">
                  Supports: JPG, PNG, JPEG
                </p>
              </div>
            </Fragment>
          )}

          {/* Step 2: Preview & Basic Result (Shows when file is selected) */}
          {selectedFile && (
            <Fragment>
              {/* Image Preview */}
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">
                  Photo Preview
                </h3>
                <div className="relative inline-block border-4 border-gray-200 rounded-lg p-2 shadow-inner bg-gray-100 max-w-full">
                  {/* ... (Image tag and remove button) ... */}
                  <img
                    src={preview}
                    alt="Selected preview"
                    className="max-w-full h-auto max-h-64 md:max-h-80 rounded-md object-contain"
                    onLoad={() => URL.revokeObjectURL(preview)}
                  />
                  <button
                    onClick={handleClearFile}
                    className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-2 shadow-lg hover:bg-red-600 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
                    aria-label="Remove image"
                  >
                    {" "}
                    <LuX size={18} />{" "}
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-600 truncate">
                  {selectedFile.name}
                </p>
              </div>

              {/* Scan Button (Show only if result not yet available) */}
              {!result && !isLoadingScan && (
                <button
                  onClick={handleSubmitScan}
                  className="w-full bg-linear-to-r from-teal-500 to-cyan-600 text-white font-bold py-4 px-6 rounded-lg shadow-lg text-lg flex items-center justify-center transition-all duration-300 hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!selectedFile || isLoadingScan}
                >
                  <LuScanLine className="mr-2 text-xl" /> Ab Scan Karein
                </button>
              )}

              {/* Loading Indicator for Scan */}
              {isLoadingScan && (
                <div className="flex items-center justify-center p-4 rounded-lg bg-gray-50 border">
                  <LuLoader className="animate-spin text-2xl text-green-600" />
                  <p className="ml-3 text-gray-600">
                    Fasal ki jaanch ho rahi hai...
                  </p>
                </div>
              )}

              {/* Basic Scan Result Display (Only Disease + Confidence) */}
              {result && !isLoadingScan && (
                <div className="p-5 rounded-xl bg-white shadow-lg border border-gray-100">
                  {/* Title Section */}
                  <div className="flex items-center mb-5">
                    <div className="p-2 bg-green-100 rounded-full mr-3 shrink-0">
                      <LuCheck className="text-xl text-green-700" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-800">
                      Scan Result
                    </h4>
                  </div>

                  {/* Content Section */}
                  <div className="space-y-5">
                    {/* Predicted Disease */}
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Predicted Disease
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {result.predicted_disease.replace(/_/g, " ")}
                      </p>
                    </div>

                    {/* Confidence */}
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Confidence
                      </p>
                      <p
                        className={`text-3xl font-extrabold text-green-500 mt-1`}
                      >
                        {result.confidence}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Show Scan Error here as well */}
              {error &&
                error.includes("Scan failed") && ( // Only show scan-related errors here
                  <ErrorCard message={error} />
                )}
            </Fragment>
          )}
        </div>{" "}
        {/* End Left Column */}
        {/* --- Right Column (Instructions / AI Cure Response) --- */}
        <div className="mt-8 lg:mt-0 lg:sticky lg:top-8">
          {" "}
          {/* Sticky position for desktop */}
          {/* Initial Instructions (Hide when scan starts or error occurs) */}
          {!selectedFile && !isLoadingScan && !result && !error && (
            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-200 text-center lg:max-h-[500px] lg:flex lg:flex-col lg:justify-center">
              {" "}
              {/* Adjust height as needed */}
              <LuScanLine className="mx-auto text-5xl text-emerald-600 mb-3" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Scan Result & Ilaaj Yahaan Dikhega
              </h3>
              <p className="text-gray-600">
                Left side par photo upload/capture karein aur "Ab Scan Karein"
                button dabayein.
              </p>
            </div>
          )}
          {/* Show ResultDisplay (Cure Logic) only when scan is complete */}
          {result && !isLoadingScan && (
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200 lg:max-h-[460px] lg:overflow-y-auto">
              {" "}
              {/* Scrollable on desktop */}
              <h3 className="text-xl font-semibold text-gray-700 mb-4">
                <LuSparkles className="inline-block mr-2 text-green-600" />{" "}
                Sarthi AI Sujhaav
              </h3>
              {/* Cure Button or Loading or Result */}
              {!cure && !isCureLoading && (
                <button
                  onClick={handleGetCure}
                  className="w-full bg-linear-to-r from-green-500 to-emerald-600 text-white font-bold py-3 px-6 rounded-lg shadow-md flex items-center justify-center transition-transform duration-200 hover:scale-105"
                >
                  <LuSparkles className="mr-2" /> Ilaaj Poochein for{"" }
                  {result.predicted_disease.replace(/_/g, " ")}
                </button>
              )}
              {isCureLoading && (
                <div className="flex items-center justify-center p-4 rounded-lg bg-gray-50 border">
                  <LuLoader className="animate-spin text-2xl text-green-600" />
                  <p className="ml-3 text-gray-600">
                    Sarthi AI se ilaaj poochh rahe hain...
                  </p>
                </div>
              )}
              {/* Show Cure Error specifically */}
              {error &&
                !error.includes("Scan failed") && ( // Show cure-related errors here
                  <ErrorCard message={error} />
                )}
              {cure && (
                <div className="animate-fadeIn mt-4 prose prose-sm max-w-none prose-p:my-1 prose-ul:my-2 prose-li:my-1 text-gray-700">
                  <ReactMarkdown>{cure}</ReactMarkdown>
                </div>
              )}
            </div>
          )}
        </div>{" "}
        {/* End Right Column */}
      </div>{" "}
      {/* End Grid */}
    </main>
  );
}

export default ScanPage;
