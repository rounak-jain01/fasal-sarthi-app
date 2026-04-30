import os
import io
import json
import threading
import requests
import joblib
import numpy as np
import pandas as pd
import tensorflow as tf
from datetime import datetime, timezone, timedelta
from functools import wraps
from PIL import Image

# Flask & Third-party
from flask import Flask, request, jsonify, g
from flask_cors import CORS
from dotenv import load_dotenv
from supabase import create_client, Client

# Suppress TensorFlow warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

""" =====================================================================
    SECTION 1: APP CONFIGURATION & ENVIRONMENT SETUP
====================================================================="""
load_dotenv() # Load environment variables from .env file

app = Flask(__name__)
CORS(app)

""" =====================================================================
    SECTION 2: SUPABASE DATABASE & AUTHENTICATION
====================================================================="""
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
supabase: Client = None

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("CRITICAL ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY not set in .env!")
else:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        print("✅ Supabase service client initialized successfully.")
    except Exception as e:
        print(f"CRITICAL ERROR: Failed to initialize Supabase client: {e}")

def token_required(f):
    """Gatekeeper: Checks for valid Supabase JWT token in headers."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not supabase:
            return jsonify({"error": "Authentication system is not configured."}), 503

        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({"error": "Authorization header missing."}), 401

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return jsonify({"error": "Invalid Authorization header format."}), 401
        
        jwt_token = parts[1]

        try:
            user_response = supabase.auth.get_user(jwt_token)
            user = user_response.user
            if not user:
                return jsonify({"error": "Invalid or expired token."}), 401
            g.user = user
        except Exception as e:
            print(f"Token verification error: {e}")
            return jsonify({"error": "Token verification failed. Invalid or expired token."}), 401
        
        return f(*args, **kwargs)
    return decorated_function

""" =====================================================================
    SECTION 3: MACHINE LEARNING MODELS INITIALIZATION
====================================================================="""
# --- 3.1 Disease Prediction Model (Lazy Load for efficiency) ---
TFLITE_MODEL_PATH = 'FasalSarthi_Full_Model.tflite'
CLASS_NAMES = [
    'Corn__Blight', 'Corn__Common_Rust', 'Corn___healthy', 'Corn__gray_Leaf_Spot', 
    'Pepper__bell___Bacterial_spot', 'Pepper__bell___healthy', 'Potato___Early_blight', 
    'Potato___Late_blight', 'Potato___healthy', 'Tomato_Bacterial_spot', 
    'Tomato_Early_blight', 'Tomato_Late_blight', 'Tomato_Leaf_Mold', 
    'Tomato_Septoria_leaf_spot', 'Tomato_Spider_mites_Two_spotted_spider_mite', 
    'Tomato__Target_Spot', 'Tomato__Tomato_YellowLeaf__Curl_Virus', 
    'Tomato__Tomato_mosaic_virus', 'Tomato_healthy'
]

disease_interpreter = None
model_loading_error = None
interpreter_lock = threading.Lock()

def get_disease_interpreter():
    global disease_interpreter, model_loading_error
    if disease_interpreter is not None: return disease_interpreter
    if model_loading_error is not None: return None

    print("Attempting to load TFLite model interpreter...")
    try:
        disease_interpreter = tf.lite.Interpreter(model_path=TFLITE_MODEL_PATH)
        disease_interpreter.allocate_tensors()
        print("✅ TFLite interpreter loaded successfully.")
        return disease_interpreter
    except Exception as e:
        print(f"CRITICAL ERROR loading TFLite interpreter: {e}")
        model_loading_error = e
        return None

# --- 3.2 Crop Recommendation Model ---
CROP_MODEL_STACKING_PATH = 'best_stacking_model_final.joblib'
CROP_SCALER_PATH = 'scaler_final.joblib'
CROP_ENCODER_FINAL_PATH = 'encoder_final.joblib'

CROP_FULL_FEATURE_NAMES = [
    'soil_ph', 'nitrogen_kg_ha', 'phosphorus_kg_ha', 'potassium_kg_ha', 'annual_rainfall_mm', 'avg_temp_c', 'avg_humidity_pct',
    'soil_type_Black (Vertisol)', 'soil_type_Laterite', 'soil_type_Loamy', 'soil_type_Red', 'soil_type_Sandy',
    'irrigation_type_Drip', 'irrigation_type_Groundwater', 'irrigation_type_Mixed', 'irrigation_type_Rainfed', 'irrigation_type_Sprinkler',
    'previous_crop_Dal', 'previous_crop_Fallow', 'previous_crop_Ganna', 'previous_crop_Makka', 'previous_crop_Moongfali', 'previous_crop_Rice', 'previous_crop_Sarson', 'previous_crop_Wheat'
]
CROP_NUMERICAL_FEATURES = CROP_FULL_FEATURE_NAMES[:7]

try:
    crop_model_stacking = joblib.load(CROP_MODEL_STACKING_PATH)
    crop_scaler = joblib.load(CROP_SCALER_PATH)
    crop_encoder_final = joblib.load(CROP_ENCODER_FINAL_PATH)
    print("✅ Crop Recommendation models loaded successfully.")
except Exception as e:
    print(f"❌ Error loading Crop Recommendation model: {e}")
    crop_model_stacking = crop_scaler = crop_encoder_final = None

# --- 3.3 Fertilizer Recommendation Model ---
FERT_MODEL_PATH = 'random_forest_model.joblib'
FERT_COLUMNS_PATH = 'model_columns.joblib'
FERT_ENCODER_PATH = 'label_encoder.joblib'

try:
    fert_model = joblib.load(FERT_MODEL_PATH)
    fert_model_columns = joblib.load(FERT_COLUMNS_PATH)
    fert_encoder = joblib.load(FERT_ENCODER_PATH)
    print("✅ Fertilizer Recommendation models loaded successfully.")
except Exception as e:
    print(f"❌ Error loading Fertilizer Recommendation model: {e}")
    fert_model = fert_model_columns = fert_encoder = None

""" =====================================================================
    SECTION 4: EXTERNAL APIs (GROQ, WEATHER, MANDI)
====================================================================="""
# Groq AI Setup
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.1-8b-instant" # Fast and smart model for chat

if not GROQ_API_KEY: print("⚠️ WARNING: GROQ_API_KEY not set!")
else: print("✅ Groq AI API configured.")

# Weather API Setup
OWM_API_KEY = os.getenv('OWM_API_KEY')
OWM_API_URL = "https://api.openweathermap.org/data/2.5/weather"
if not OWM_API_KEY: print("⚠️ WARNING: OWM_API_KEY not set!")

# Mandi API Setup
DATA_GOV_API_KEY = os.getenv('DATA_GOV_API_KEY')
MANDI_API_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"
if not DATA_GOV_API_KEY: print("⚠️ WARNING: DATA_GOV_API_KEY not set!")


""" =====================================================================
    SECTION 5: API ENDPOINTS / ROUTES
====================================================================="""

@app.route('/', methods=['GET'])
def home():
    return jsonify({"status": "success", "message": "Fasal Sarthi Backend Server is running!"})

@app.route('/predict_disease', methods=['POST'])
@token_required
def handle_prediction():
    interpreter = get_disease_interpreter()
    if interpreter is None:
         return jsonify({"error": "Disease model could not be loaded."}), 503

    if 'file' not in request.files: return jsonify({"error": "No file part key found"}), 400
    file = request.files.get('file')
    if not file or file.filename == '': return jsonify({"error": "No selected file"}), 400

    try:
        input_details = interpreter.get_input_details()
        output_details = interpreter.get_output_details()

        # Image Preprocessing
        image_bytes = file.read()
        img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        
        target_shape = input_details[0]['shape']
        img = img.resize((target_shape[2], target_shape[1]))

        img_array = tf.keras.preprocessing.image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0).astype(input_details[0]['dtype'])

        # Normalization
        # if input_details[0]['dtype'] == np.float32:
        #      img_array = img_array / 255.0

        # Normalization (EfficientNet expects 0-255 raw pixels, or its own preprocess_input)
        if input_details[0]['dtype'] == np.float32:
             # Option A: Agar aapne manually /255 karke train kiya tha, toh ise rehne dein.
             # Option B: EfficientNet default use kiya tha toh ise hata dein. 
             # Sabse best aur safe tareeka yeh hai ki EfficientNet ka in-built preprocessor use karein:
             img_array = tf.keras.applications.efficientnet.preprocess_input(img_array)


        # Run Inference (Thread-safe)
        with interpreter_lock:
            interpreter.set_tensor(input_details[0]['index'], img_array)
            interpreter.invoke() 
            predictions = interpreter.get_tensor(output_details[0]['index']).copy()

        # Post-processing
        predicted_class_index = np.argmax(predictions[0])
        predicted_class_name = CLASS_NAMES[predicted_class_index]
        confidence = float(np.max(predictions[0])) 
        
        return jsonify({
            "predicted_disease": predicted_class_name,
            "confidence": f"{confidence * 100:.2f}%"
        })

    except Exception as e:
        print(f"Prediction error: {e}")
        return jsonify({"error": "Error processing image"}), 500


@app.route('/recommend_crop', methods=['POST'])
@token_required
def handle_crop_recommendation():
    if not crop_model_stacking:
        return jsonify({"error": "Crop Recommendation model not loaded."}), 500

    data = request.json
    try:
        input_df = pd.DataFrame(columns=CROP_FULL_FEATURE_NAMES, index=[0]).fillna(0.0)
        numerical_values_dict = {}

        for feature in CROP_NUMERICAL_FEATURES:
            if feature not in data: raise KeyError(f"Missing: {feature}")
            numerical_values_dict[feature] = float(data[feature])

        # Scale Numerical Features
        scaled_num_vals = crop_scaler.transform(pd.DataFrame([numerical_values_dict], columns=CROP_NUMERICAL_FEATURES))
        input_df[CROP_NUMERICAL_FEATURES] = scaled_num_vals 

        # One-Hot Encode Categorical
        cat_mappings = {
            'soil_type': data.get('soil_type'),
            'irrigation_type': data.get('irrigation_type'),
            'previous_crop': data.get('previous_crop')
        }

        for cat_type, cat_val in cat_mappings.items():
            if not cat_val: raise KeyError(f"Missing: {cat_type}")
            col_name = f'{cat_type}_{cat_val}'
            if col_name in input_df.columns:
                input_df.loc[0, col_name] = 1.0

        input_final = input_df[CROP_FULL_FEATURE_NAMES]
        prediction_encoded = crop_model_stacking.predict(input_final)
        predicted_crop_name = crop_encoder_final.inverse_transform(prediction_encoded)

        return jsonify({"recommended_crop": predicted_crop_name[0]})

    except KeyError as e: return jsonify({"error": f"Missing input feature: {e}"}), 400
    except Exception as e:
        print(f"Crop Rec Error: {e}")
        return jsonify({"error": "Failed to recommend crop"}), 500


@app.route('/recommend_fertilizer', methods=['POST'])
@token_required
def handle_fertilizer_recommendation():
    if not fert_model:
        return jsonify({"error": "Fertilizer model is not loaded."}), 500

    data = request.json
    num_features = ['Temparature', 'Humidity', 'Moisture', 'Nitrogen', 'Potassium', 'Phosphorous']
    
    try:
        input_data = {feat: float(data[feat]) for feat in num_features if feat in data}
        soil_type, crop_type = data.get('Soil_Type'), data.get('Crop_Type')

        if not soil_type or not crop_type: raise KeyError("Missing Soil_Type or Crop_Type")

        input_df = pd.DataFrame(columns=fert_model_columns, index=[0]).fillna(0)
        for key, value in input_data.items():
            if key in input_df.columns: input_df.loc[0, key] = value

        soil_col, crop_col = f'Soil_Type_{soil_type}', f'Crop_Type_{crop_type}'
        
        if soil_col in input_df.columns: input_df.loc[0, soil_col] = 1
        if crop_col in input_df.columns: input_df.loc[0, crop_col] = 1
            
        prediction_encoded = fert_model.predict(input_df[fert_model_columns])
        predicted_fertilizer = fert_encoder.inverse_transform(prediction_encoded)

        return jsonify({"recommended_fertilizer": predicted_fertilizer[0]})

    except Exception as e:
        print(f"Fertilizer Rec Error: {e}")
        return jsonify({"error": str(e)}), 400


@app.route('/sarthi_ai_chat', methods=['POST'])
@token_required
def handle_chat():
    if not GROQ_API_KEY: return jsonify({"error": "Groq API key not configured."}), 503

    data = request.json
    user_message = data.get('message')
    language_code = data.get('language', 'hi')
    chat_history = data.get('history', [])

    if not user_message: return jsonify({"error": "No message provided"}), 400

    try:
        # Generate System Prompt
        if language_code == 'hi':
            system_prompt = """तुम 'फसल सारथी' हो, एक विशेषज्ञ AI सहायक जो केवल हिंदी में किसानों की मदद करते हो। 
            तुम्हारे जवाब हमेशा सरल, मददगार और खेती से संबंधित होने चाहिए। 
            अगर कोई खेती से अलग सवाल पूछे, तो विनम्रता से मना कर दो।"""
        else:
            system_prompt = """You are 'Fasal Sarthi', an expert AI assistant who helps farmers with agriculture. 
            You must respond *only* in English. Your answers should be simple, helpful, and related to farming."""

        # Format Messages for Groq (OpenAI format)
        messages = [{"role": "system", "content": system_prompt}]
        
        for msg in chat_history:
            # Assuming frontend history role is 'user' or 'bot'/'assistant'
            role = "user" if msg.get('role') == "user" else "assistant"
            messages.append({"role": role, "content": msg.get('message', '')})
            
        messages.append({"role": "user", "content": user_message})

        # API Call to Groq
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": GROQ_MODEL,
            "messages": messages,
            "temperature": 0.7
        }
        
        response = requests.post(GROQ_API_URL, headers=headers, json=payload)
        
        # --- YEH NAYA CODE ADD KAREIN ---
        if response.status_code != 200:
            print("🚨 GROQ API ERROR DETAILED INFO 🚨")
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text}")
            return jsonify({"error": f"Groq API Error: {response.status_code}"}), 500
        # --------------------------------
        # --------------------------------------------------
        response.raise_for_status()

        response_data = response.json()
        bot_response = response_data['choices'][0]['message']['content']
        
        return jsonify({"response": bot_response})

    except Exception as e:
        print(f"Groq Chat Error: {e}")
        return jsonify({"error": "Failed to generate AI response"}), 500


# @app.route('/get_weather', methods=['POST'])
# @token_required
# def handle_get_weather():
#     data = request.json
#     params = {'appid': OWM_API_KEY, 'units': 'metric'}
    
#     if data.get('lat') is not None and data.get('lon') is not None:
#         params.update({'lat': data.get('lat'), 'lon': data.get('lon')})
#     elif data.get('city'):
#         params['q'] = data.get('city')
#     else:
#         return jsonify({"error": "City name or coordinates required"}), 400

#     try:
#         response = requests.get(OWM_API_URL, params=params)
#         weather_data = response.json()

#         # 👇 --- YAHAN SE NAYA CODE ADD KAREIN --- 👇
#         print("\n" + "="*50)
#         print("🚨 OPENWEATHER RAW API DATA 🚨")
#         import json # Agar upar import nahi hai toh
#         print(json.dumps(weather_data, indent=4)) # Isse data sundar (formatted) dikhega
#         print("="*50 + "\n")
#         # 👆 --- YAHAN TAK --- 👆
        
#         if weather_data.get('cod') != 200:
#             return jsonify({"error": weather_data.get('message', 'Location not found')}), 404
        
#         sys_data = weather_data.get('sys', {})
#         main = weather_data.get('main', {})
#         wind = weather_data.get('wind', {})
#         desc = weather_data.get('weather', [{}])[0]

#         ist_offset = timedelta(hours=5, minutes=30)
#         def format_time(ts):
#             if not ts: return 'N/A'
#             return datetime.fromtimestamp(ts + weather_data.get('timezone', 0), timezone.utc).astimezone(timezone(ist_offset)).strftime('%I:%M %p')

#         simplified_data = {
#             "city": weather_data.get('name', 'N/A'),
#             "temperature": main.get('temp'),
#             "feels_like": main.get('feels_like'),
#             "humidity": main.get('humidity'),
#             "description": desc.get('description', 'N/A').capitalize(),
#             "wind_speed": wind.get('speed'),
#             "rain_1h": weather_data.get('rain', {}).get('1h', 0),
#             "sunrise": format_time(sys_data.get('sunrise')),
#             "sunset": format_time(sys_data.get('sunset')),
#             "icon_url": f"http://openweathermap.org/img/wn/{desc.get('icon')}@2x.png" if desc.get('icon') else None
#         }

#         return jsonify({k: v for k, v in simplified_data.items() if v is not None})
#     except Exception as e:
#         print(f"Weather Error: {e}")
#         return jsonify({"error": "Failed to fetch weather data"}), 500

# --- OPEN-METEO WEATHER HELPER FUNCTION ---
def get_weather_desc_and_icon(wmo_code, is_day):
    """Open-Meteo WMO codes ko Description aur Icons mein badalna"""
    day_night = "d" if is_day else "n"
    
    weather_mapping = {
        0: ("Clear sky", f"01{day_night}"),
        1: ("Mainly clear", f"02{day_night}"),
        2: ("Partly cloudy", f"03{day_night}"),
        3: ("Overcast", f"04{day_night}"),
        45: ("Fog", f"50{day_night}"),
        48: ("Depositing rime fog", f"50{day_night}"),
        51: ("Light drizzle", f"09{day_night}"),
        53: ("Moderate drizzle", f"09{day_night}"),
        55: ("Dense drizzle", f"09{day_night}"),
        56: ("Light freezing drizzle", f"09{day_night}"),
        57: ("Dense freezing drizzle", f"09{day_night}"),
        61: ("Slight rain", f"10{day_night}"),
        63: ("Moderate rain", f"10{day_night}"),
        65: ("Heavy rain", f"10{day_night}"),
        71: ("Slight snow fall", f"13{day_night}"),
        75: ("Heavy snow fall", f"13{day_night}"),
        80: ("Slight rain showers", f"09{day_night}"),
        81: ("Moderate rain showers", f"09{day_night}"),
        82: ("Violent rain showers", f"09{day_night}"),
        95: ("Thunderstorm", f"11{day_night}"),
        96: ("Thunderstorm with slight hail", f"11{day_night}"),
        99: ("Thunderstorm with heavy hail", f"11{day_night}"),
    }
    
    return weather_mapping.get(wmo_code, ("Unknown", f"01{day_night}"))

# --- NAYA WEATHER ENDPOINT (OPEN-METEO) ---
@app.route('/get_weather', methods=['POST'])
@token_required
def handle_get_weather():
    data = request.json
    lat = data.get('lat')
    lon = data.get('lon')
    city_name = data.get('city')
    country = "IN" # Default

    try:
        # STEP 1: Agar sirf City Name aaya hai, toh uska Lat/Lon nikalo (Geocoding)
        if not lat or not lon:
            if not city_name:
                return jsonify({"error": "City name or coordinates (lat, lon) are required"}), 400
            
            geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={city_name}&count=1&format=json"
            geo_response = requests.get(geo_url).json()
            
            if "results" not in geo_response or len(geo_response["results"]) == 0:
                return jsonify({"error": f"Location '{city_name}' not found."}), 404
                
            location_data = geo_response["results"][0]
            lat = location_data["latitude"]
            lon = location_data["longitude"]
            city_name = location_data["name"]
            country = location_data.get("country_code", "Unknown")
        else:
            # Agar GPS se direct Lat/Lon aaya hai
            city_name = city_name or "Your Location"

        # STEP 2: Open-Meteo se Accurate Weather Data nikalo
        weather_url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,surface_pressure,wind_speed_10m",
            "daily": "temperature_2m_max,temperature_2m_min,sunrise,sunset",
            "timezone": "auto" # <--- Yeh sabse best feature hai! Direct uss jagah ka time aayega
        }

        response = requests.get(weather_url, params=params)
        weather_data = response.json()

        if "error" in weather_data:
            return jsonify({"error": "Failed to fetch weather from Open-Meteo"}), 500

        # STEP 3: Frontend ke format mein data pack karo
        current = weather_data["current"]
        daily = weather_data["daily"]

        # WMO code se description aur icon nikalo
        desc, icon_code = get_weather_desc_and_icon(current["weather_code"], current["is_day"])

        # Time ko aasan format mein badalna (Jaise: 06:30 AM)
        def format_time(iso_time_str):
            if not iso_time_str: return "N/A"
            dt = datetime.fromisoformat(iso_time_str)
            return dt.strftime('%I:%M %p')

        simplified_data = {
            "city": city_name,
            "country": country,
            "temperature": current.get("temperature_2m"),
            "feels_like": current.get("apparent_temperature"),
            "temp_max": daily.get("temperature_2m_max", [None])[0],
            "temp_min": daily.get("temperature_2m_min", [None])[0],
            "humidity": current.get("relative_humidity_2m"),
            "pressure": current.get("surface_pressure"),
            "description": desc,
            "wind_speed": current.get("wind_speed_10m"),
            "rain_1h": current.get("precipitation"),
            "clouds": current.get("cloud_cover"),
            "sunrise": format_time(daily.get("sunrise", [None])[0]),
            "sunset": format_time(daily.get("sunset", [None])[0]),
            "icon_url": f"https://openweathermap.org/img/wn/{icon_code}@4x.png" # OpenWeather ke badhiya icons hi use karenge
        }

        # None (Khali) values hatao taaki Frontend par error na aaye
        simplified_data = {k: v for k, v in simplified_data.items() if v is not None}

        return jsonify(simplified_data)

    except Exception as e:
        print(f"Open-Meteo Error: {e}")
        return jsonify({"error": "An internal error occurred while fetching weather."}), 500


@app.route('/get_mandi_prices', methods=['POST'])
@token_required
def handle_mandi_prices():
    if not DATA_GOV_API_KEY: return jsonify({"error": "Mandi API key missing."}), 503

    data = request.json
    if not data.get('state') or not data.get('commodity'):
        return jsonify({"error": "State and commodity are required."}), 400

    params = {
        'api-key': DATA_GOV_API_KEY,
        'format': 'json',
        'filters[state]': data.get('state'),
        'filters[commodity]': data.get('commodity'),
        'limit': 50
    }
    if data.get('district'): params['filters[district]'] = data.get('district')

    try:
        response = requests.get(MANDI_API_URL, params=params)
        response.raise_for_status()

        records = response.json().get('records', [])
        if not records: return jsonify([])

        simplified_prices = [{
            "mandi": r.get('market'),
            "district": r.get('district'),
            "price": r.get('modal_price'),
            "date": r.get('arrival_date'),
            "variety": r.get('variety'),
            "min_price": r.get('min_price'),
            "max_price": r.get('max_price')
        } for r in records]

        return jsonify(simplified_prices)

    except Exception as e:
        print(f"Mandi Data Error: {e}")
        return jsonify({"error": "Error processing Mandi data."}), 500

""" =====================================================================
    SECTION 6: MAIN EXECUTION
====================================================================="""
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)