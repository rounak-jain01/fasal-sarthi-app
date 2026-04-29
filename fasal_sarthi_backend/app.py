import os
import io
import threading
import numpy as np
from flask import Flask, request, jsonify, g
from flask_cors import CORS
from keras import layers, models, applications
import tensorflow as tf
from keras.applications import EfficientNetB3
from keras.layers import Input, GlobalAveragePooling2D, Dense, Dropout
from keras import Model
from PIL import Image
import requests  #Direct API Calls for Gemini and Weather
import json
import joblib
from datetime import datetime, timezone, timedelta
import pandas as pd # For handling categorical features
from sklearn.preprocessing import LabelEncoder # Although we load it, good to import
from dotenv import load_dotenv
# Supabase library aur decorator ke liye imports
from supabase import create_client, Client
from functools import wraps

load_dotenv() # Load environment variables from .env file like API keys

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
supabase: Client = None

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("CRITICAL ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY not set in .env!")
else:
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        print("✅ Supabase service client initialized successfully.")
    except Exception as e:
        print(f"CRITICAL ERROR: Failed to initialize Supabase client: {e}")
# --- 2. MODEL LOADING ---
# MODEL_WEIGHTS_PATH = 'FasalSarthi_Full_Model.h5'
TFLITE_MODEL_PATH = 'FasalSarthi_Full_Model.tflite'
IMAGE_SIZE = (300, 300)
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
model_loading_error = None # To store loading error
interpreter_lock = threading.Lock()  # For thread-safety when invoking interpreter

def get_disease_interpreter():
    global disease_interpreter, model_loading_error
    if disease_interpreter is not None: return disease_interpreter
    if model_loading_error is not None: return None

    print("Attempting to load TFLite model interpreter (Lazy Load)...")
    try:
        disease_interpreter = tf.lite.Interpreter(model_path=TFLITE_MODEL_PATH)
        disease_interpreter.allocate_tensors() # IMPORTANT: Allocate memory
        print("✅ TFLite interpreter loaded successfully ON DEMAND.")
        return disease_interpreter
    except ValueError as e:
         print(f"CRITICAL ERROR: Failed to load TFLite model '{TFLITE_MODEL_PATH}'. Corrupted or missing? Error: {e}")
         model_loading_error = e
         disease_interpreter = None
         return None
    except Exception as e:
        print(f"CRITICAL ERROR loading TFLite interpreter: {e}")
        import traceback
        traceback.print_exc()
        model_loading_error = e
        disease_interpreter = None
        return None
    
# --- 3. FLASK APP LOGIC ---
app = Flask(__name__)
CORS(app)

def token_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not supabase:
            return jsonify({"error": "Authentication system is not configured."}), 503
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({"error": "Authorization header missing."}), 401
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return jsonify({"error": "Invalid Authorization header format. Must be 'Bearer <token>'."}), 401
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

@app.route('/', methods=['GET'])
def home():
    return "Fasal Sarthi Backend Server is running!"

@app.route('/predict_disease', methods=['POST'])
@token_required
def handle_prediction():
    interpreter = get_disease_interpreter()
    if interpreter is None:
         error_msg = str(model_loading_error) if model_loading_error else "Disease model could not be loaded."
         return jsonify({"error": f"Model loading failed: {error_msg}"}), 503
    try:
        input_details = interpreter.get_input_details()
        output_details = interpreter.get_output_details()
    except Exception as e:
         print(f"Error getting interpreter details: {e}")
         return jsonify({"error": "Failed to get model input/output details."}), 500
    if 'file' not in request.files: return jsonify({"error": "No file part key found"}), 400
    file = request.files.get('file')
    if not file or file.filename == '': return jsonify({"error": "No selected file"}), 400
    try:
        image_bytes = file.read()
        img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        input_shape = input_details[0]['shape'] # e.g., [1, 300, 300, 3]
        target_height = input_shape[1]
        target_width = input_shape[2]
        img = img.resize((target_width, target_height))
        img_array = tf.keras.preprocessing.image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        input_dtype = input_details[0]['dtype'] # e.g., np.float32 or np.uint8
        img_array = img_array.astype(input_dtype)
        input_scale, input_zero_point = input_details[0].get('quantization', (1.0, 0)) 

        if input_dtype == np.float32 and input_scale == 1.0 and input_zero_point == 0:
             img_array = img_array / 255.0
        elif input_dtype == np.uint8:
             pass # Assuming img_to_array gives 0-255
        interpreter.set_tensor(input_details[0]['index'], img_array)
        interpreter.invoke() # Run inference
        predictions = interpreter.get_tensor(output_details[0]['index'])
        output_scale, output_zero_point = output_details[0].get('quantization', (1.0, 0))
        if output_details[0]['dtype'] == np.uint8: # If output is quantized
            predictions = (predictions.astype(np.float32) - output_zero_point) * output_scale
        predicted_class_index = np.argmax(predictions[0])
        if predicted_class_index >= len(CLASS_NAMES):
             print(f"ERROR: Predicted index {predicted_class_index} out of bounds for CLASS_NAMES (len {len(CLASS_NAMES)})")
             return jsonify({"error": "Model prediction resulted in invalid class index."}), 500
        predicted_class_name = CLASS_NAMES[predicted_class_index]
        confidence = float(np.max(predictions[0])) 
        return jsonify({
            "predicted_disease": predicted_class_name,
            "confidence": f"{confidence * 100:.2f}%"
        })

    except Exception as e:
        print(f"Prediction error with TFLite model: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Error processing image with TFLite model"}), 500
    
# --- 4. CROP RECOMMENDATION MODEL LOADING ---
CROP_MODEL_STACKING_PATH = 'best_stacking_model_final.joblib'
CROP_SCALER_PATH = 'scaler_final.joblib'
CROP_FULL_FEATURE_NAMES = [
    'soil_ph', 'nitrogen_kg_ha', 'phosphorus_kg_ha', 'potassium_kg_ha', 'annual_rainfall_mm', 'avg_temp_c', 'avg_humidity_pct', # 7 Numerical
    'soil_type_Black (Vertisol)', 'soil_type_Laterite', 'soil_type_Loamy', 'soil_type_Red', 'soil_type_Sandy', # 5 Soil Types (Missing Alluvial?)
    'irrigation_type_Drip', 'irrigation_type_Groundwater', 'irrigation_type_Mixed', 'irrigation_type_Rainfed', 'irrigation_type_Sprinkler', # 5 Irrigation Types (Missing Canal, Tank?)
    'previous_crop_Dal', 'previous_crop_Fallow', 'previous_crop_Ganna', 'previous_crop_Makka', 'previous_crop_Moongfali', 'previous_crop_Rice', 'previous_crop_Sarson', 'previous_crop_Wheat' # 8 Previous Crops
]

CROP_NUMERICAL_FEATURES = CROP_FULL_FEATURE_NAMES[:7]
POSSIBLE_SOIL_TYPES = sorted(['Black (Vertisol)', 'Laterite', 'Loamy', 'Red', 'Sandy'])
POSSIBLE_IRRIGATION_TYPES = sorted(['Drip', 'Groundwater', 'Mixed', 'Rainfed', 'Sprinkler'])
POSSIBLE_PREVIOUS_CROPS = sorted(['Dal', 'Fallow', 'Ganna', 'Makka', 'Moongfali', 'Rice', 'Sarson', 'Wheat'])
try:
    crop_model_stacking = joblib.load(CROP_MODEL_STACKING_PATH)
    crop_scaler = joblib.load(CROP_SCALER_PATH)
    crop_encoder_final = joblib.load(CROP_ENCODER_FINAL_PATH)
    scaler_features = getattr(crop_scaler, 'feature_names_in_', CROP_NUMERICAL_FEATURES)
    if list(scaler_features) != CROP_NUMERICAL_FEATURES:
         print(f"CRITICAL WARNING: Scaler features {list(scaler_features)} do not match expected numerical {CROP_NUMERICAL_FEATURES}. Scaling might be incorrect!")
    else:
         print("Scaler features validated.")
    model_features_count = getattr(crop_model_stacking, 'n_features_in_', None)
    if model_features_count and model_features_count != len(CROP_FULL_FEATURE_NAMES):
        print(f"CRITICAL WARNING: Model expects {model_features_count} features, but calculated list has {len(CROP_FULL_FEATURE_NAMES)}!")
    elif not model_features_count:
         print("Warning: Could not read n_features_in_ from model.")
    print(f"Model expects features in this order: {CROP_FULL_FEATURE_NAMES}")
    print("Crop Recommendation (Stacking) model, scaler, and encoder loaded.")

except Exception as e:
    crop_full_feature_names = []
@app.route('/recommend_crop', methods=['POST'])
@token_required
def handle_crop_recommendation():
    if not crop_model_stacking or not crop_scaler or not crop_encoder_final or len(CROP_FULL_FEATURE_NAMES) != 25: # Check for 25
        return jsonify({"error": "Crop Recommendation model setup incorrect or not loaded."}), 500

    data = request.json
    print(f"Received data for crop rec: {data}")

    try:
        input_df = pd.DataFrame(columns=CROP_FULL_FEATURE_NAMES, index=[0]).fillna(0.0)
        numerical_values_dict = {}
        for feature_name in CROP_NUMERICAL_FEATURES:
            if feature_name not in data: raise KeyError(f"Missing: {feature_name}")
            value = float(data[feature_name])
            input_df.loc[0, feature_name] = value # Store raw first
            numerical_values_dict[feature_name] = value
        numerical_df_for_scaling = pd.DataFrame([numerical_values_dict], columns=CROP_NUMERICAL_FEATURES)
        scaled_numerical_values = crop_scaler.transform(numerical_df_for_scaling)
        input_df[CROP_NUMERICAL_FEATURES] = scaled_numerical_values # Put scaled back
        soil_type = data.get('soil_type') # e.g., 'Black (Vertisol)'
        if not soil_type: raise KeyError("Missing: soil_type")
        soil_col_name = f'soil_type_{soil_type}'
        if soil_col_name in input_df.columns: input_df.loc[0, soil_col_name] = 1.0
        else: raise ValueError(f"Unknown/Unsupported soil_type: {soil_type}")
        # Irrigation Type
        irrigation_type = data.get('irrigation_type') # e.g., 'Groundwater'
        if not irrigation_type: raise KeyError("Missing: irrigation_type")
        irrigation_col_name = f'irrigation_type_{irrigation_type}'
        if irrigation_col_name in input_df.columns: input_df.loc[0, irrigation_col_name] = 1.0
        else: raise ValueError(f"Unknown/Unsupported irrigation_type: {irrigation_type}")
        # Previous Crop
        previous_crop = data.get('previous_crop') # e.g., 'Wheat'
        if not previous_crop: raise KeyError("Missing: previous_crop")
        previous_crop_col_name = f'previous_crop_{previous_crop}'
        if previous_crop_col_name in input_df.columns:
            input_df.loc[0, previous_crop_col_name] = 1.0
        else:
            print(f"Warning: Received previous_crop '{previous_crop}' not in model features, treating as 'Other'.")
        input_final = input_df[CROP_FULL_FEATURE_NAMES] # Re-apply order just to be safe
        print(f"Input shape to model: {input_final.shape}") # Should be (1, 25)

        # 6. Make Prediction
        prediction_encoded = crop_model_stacking.predict(input_final)
        predicted_crop_name = crop_encoder_final.inverse_transform(prediction_encoded)
        print(f"Prediction successful: {predicted_crop_name[0]}")
        return jsonify({"recommended_crop": predicted_crop_name[0]})
    except KeyError as e: return jsonify({"error": f"Missing input feature: {e}"}), 400
    except ValueError as e: return jsonify({"error": f"Invalid input value: {e}"}), 400
    except Exception as e:
        print(f"Error during crop recommendation: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to recommend crop due to an internal error."}), 500
# --- 8. FERTILIZER RECOMMENDATION MODEL LOADING ---
FERT_MODEL_PATH = 'random_forest_model.joblib'
FERT_COLUMNS_PATH = 'model_columns.joblib'
FERT_ENCODER_PATH = 'label_encoder.joblib'
try:
    fert_model = joblib.load(FERT_MODEL_PATH)
    fert_model_columns = joblib.load(FERT_COLUMNS_PATH) # Load the expected columns
    fert_encoder = joblib.load(FERT_ENCODER_PATH)
    print("Fertilizer Recommendation model, columns, and encoder loaded successfully.")
except FileNotFoundError as e:
    print(f"Error loading Fertilizer model file: {e}. Make sure joblib files are in the correct folder.")
    fert_model = None
    fert_model_columns = None
    fert_encoder = None
except Exception as e:
    print(f"Error loading Fertilizer Recommendation model: {e}")
    fert_model = None
    fert_model_columns = None
    fert_encoder = None
# --- 9. NEW FERTILIZER RECOMMENDATION ENDPOINT ---
@app.route('/recommend_fertilizer', methods=['POST'])
@token_required
def handle_fertilizer_recommendation():
    if not fert_model or not fert_model_columns or not fert_encoder:
        return jsonify({"error": "Fertilizer Recommendation model is not loaded."}), 500
    data = request.json
    num_features = ['Temparature', 'Humidity', 'Moisture', 'Nitrogen', 'Potassium', 'Phosphorous']
    soil_prefix = 'Soil_Type_'
    crop_prefix = 'Crop_Type_'
    try:
        input_data = {feat: float(data[feat]) for feat in num_features if feat in data}
        soil_type = data.get('Soil_Type')
        crop_type = data.get('Crop_Type')

        if not soil_type or not crop_type:
             raise KeyError("Missing Soil_Type or Crop_Type in input")
        input_df = pd.DataFrame(columns=fert_model_columns, index=[0]).fillna(0)
        for key, value in input_data.items():
            if key in input_df.columns:
                 input_df.loc[0, key] = value
        soil_col_name = soil_prefix + soil_type
        if soil_col_name in input_df.columns:
            input_df.loc[0, soil_col_name] = 1
        else:
             raise ValueError(f"Unknown Soil_Type: {soil_type}")
        crop_col_name = crop_prefix + crop_type
        if crop_col_name in input_df.columns:
            input_df.loc[0, crop_col_name] = 1
        else:
            raise ValueError(f"Unknown Crop_Type: {crop_type}")
        input_final = input_df[fert_model_columns]
        prediction_encoded = fert_model.predict(input_final)
        predicted_fertilizer = fert_encoder.inverse_transform(prediction_encoded)

        return jsonify({
            "recommended_fertilizer": predicted_fertilizer[0]
        })

    except KeyError as e:
        print(f"Missing input value: {e}")
        return jsonify({"error": f"Missing input value: {e}"}), 400
    except ValueError as e:
         print(f"Invalid input value: {e}")
         return jsonify({"error": str(e)}), 400
    except Exception as e:
        print(f"Error during fertilizer recommendation: {e}")
        return jsonify({"error": "Failed to recommend fertilizer"}), 500

# --- CHATBOT SETUP ---
# --- CHATBOT SETUP (GROQ API) ---
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
if not GROQ_API_KEY:
    print("ERROR: GROQ_API_KEY environment variable not set!")
# Groq uses an OpenAI-compatible endpoint
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
print("Groq AI Chatbot (Direct API) is ready.")

# --- CHATBOT ENDPOINT (Direct API Call) ---
@app.route('/sarthi_ai_chat', methods=['POST'])
@token_required
def handle_chat():
    if not GROQ_API_KEY: return jsonify({"error": "Chatbot API key not configured."}), 503

    data = request.json
    user_message = data.get('message')
    language_code = data.get('language', 'hi')
    chat_history = data.get('history', [])

    if not user_message: 
        return jsonify({"error": "No message provided"}), 400

    try:
        if language_code == 'hi':
            system_prompt = """
                तुम 'फसल सारथी' हो, एक विशेषज्ञ AI सहायक जो केवल हिंदी में किसानों की मदद करते हो।
                तुम्हारे जवाब हमेशा सरल, मददगार और खेती से संबंधित होने चाहिए।
                तुम्हें हमेशा, बिना किसी अपवाद के, केवल और केवल हिंदी (देवनागरी लिपि) में ही जवाब देना है।
                अगर कोई खेती से अलग सवाल पूछे, तो विनम्रता से मना कर दो कि 'मैं सिर्फ खेती से जुड़े सवालों का जवाब दे सकता हूँ।'
            """
        else: # Default to English
            system_prompt = """
                You are 'Fasal Sarthi', an expert AI assistant who helps farmers with agriculture.
                You must respond *only* in English.
                Your answers should always be simple, helpful, and related to farming.
                If asked a non-farming question, politely decline, stating you only answer farming-related questions.
            """
            
        # Groq (OpenAI format) ke liye messages array banayenge
        messages = [{"role": "system", "content": system_prompt}]
        
        for msg in chat_history:
            # Groq me AI ke response ka role 'assistant' hota hai (Gemini me 'model' tha)
            api_role = "user" if msg['role'] == "user" else "assistant"
            messages.append({"role": api_role, "content": msg['message']})
            
        messages.append({"role": "user", "content": user_message})
        
        payload = {
            "model": "llama-3.3-70b-versatile", # Aap apni pasand ka Groq model yahan daal sakte hain (e.g., mixtral-8x7b-32768)
            "messages": messages,
            "temperature": 0.7 # Optional: Responses ko kitna creative rakhna hai
        }
        
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        
        # requests.post mein payload ko json kwarg ke through bhejna jyada safe hai
        response = requests.post(GROQ_API_URL, headers=headers, json=payload)
        
        if response.status_code != 200:
            print(f"Error from Groq API: {response.text}")
            raise Exception("Groq API returned an error")

        response_data = response.json()
        # Groq ka response structure thoda alag hota hai
        bot_response = response_data['choices'][0]['message']['content']
        
        return jsonify({"response": bot_response})

    except Exception as e:
        print(f"Error during chat generation: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to generate AI response"}), 500

# --- 6. WEATHER API SETUP ---
OWM_API_KEY = os.getenv('OWM_API_KEY')
if not OWM_API_KEY:
    print("ERROR: OWM_API_KEY environment variable not set!")
OWM_API_URL = "https://api.openweathermap.org/data/2.5/weather"
@app.route('/get_weather', methods=['POST'])
@token_required
def handle_get_weather():
    data = request.json
    city = data.get('city')
    lat = data.get('lat')
    lon = data.get('lon')

    params = {
        'appid': OWM_API_KEY,
        'units': 'metric'
    }
    
    if lat is not None and lon is not None:
        params['lat'] = lat
        params['lon'] = lon
    elif city:
        params['q'] = city
    else:
        return jsonify({"error": "City name or coordinates (lat, lon) are required"}), 400

    try:
        response = requests.get(OWM_API_URL, params=params)
        weather_data = response.json()
        
        if weather_data.get('cod') != 200:
            return jsonify({"error": weather_data.get('message', 'Location not found')}), 404
        main = weather_data.get('main', {})
        wind = weather_data.get('wind', {})
        weather_desc = weather_data.get('weather', [{}])[0]
        sys_data = weather_data.get('sys', {})
        clouds = weather_data.get('clouds', {})
        visibility = weather_data.get('visibility') # Meters
        ist_offset = timedelta(hours=5, minutes=30)
        sunrise_ts = sys_data.get('sunrise')
        sunset_ts = sys_data.get('sunset')
        sunrise_local = datetime.fromtimestamp(sunrise_ts + weather_data.get('timezone', 0), timezone.utc).astimezone(timezone(ist_offset)).strftime('%I:%M %p') if sunrise_ts else 'N/A'
        sunset_local = datetime.fromtimestamp(sunset_ts + weather_data.get('timezone', 0), timezone.utc).astimezone(timezone(ist_offset)).strftime('%I:%M %p') if sunset_ts else 'N/A'
        def deg_to_cardinal(deg):
            if deg is None: return 'N/A'
            dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
            ix = round(deg / (360. / len(dirs)))
            return dirs[ix % len(dirs)]
        
        wind_direction = deg_to_cardinal(wind.get('deg'))
        rain_1h = weather_data.get('rain', {}).get('1h', 0) # mm in last 1 hour

        simplified_data = {
            "city": weather_data.get('name', 'N/A'),
            "country": sys_data.get('country', 'N/A'),
            "temperature": main.get('temp'),
            "feels_like": main.get('feels_like'),
            "temp_min": main.get('temp_min'), # Naya
            "temp_max": main.get('temp_max'), # Naya
            "humidity": main.get('humidity'),
            "pressure": main.get('pressure'), # Naya
            "description": weather_desc.get('description', 'N/A').capitalize(),
            "wind_speed": wind.get('speed'),
            "wind_direction": wind_direction, # Naya
            "clouds": clouds.get('all'), # Naya (% cloudiness)
            "rain_1h": rain_1h, # Naya (mm)
            "visibility": visibility / 1000 if visibility else None, # Naya (Convert meters to km)
            "sunrise": sunrise_local, # Naya
            "sunset": sunset_local, # Naya
            "icon_url": f"http://openweathermap.org/img/wn/{weather_desc.get('icon')}@2x.png" if weather_desc.get('icon') else None
        }
        simplified_data = {k: v for k, v in simplified_data.items() if v is not None}

        return jsonify(simplified_data)

    except Exception as e:
        print(f"Error during detailed weather fetch: {e}")
        return jsonify({"error": "Failed to fetch detailed weather data"}), 500



# [--- MANDI API FIX (1) ---]
# data.gov.in API ki key 
DATA_GOV_API_KEY = os.getenv('DATA_GOV_API_KEY')
MANDI_API_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"

if not DATA_GOV_API_KEY:
    print("WARNING: DATA_GOV_API_KEY environment variable not set! Mandi prices will fail.")
@app.route('/get_mandi_prices', methods=['POST'])
@token_required
def handle_mandi_prices():
    if not DATA_GOV_API_KEY:
        return jsonify({"error": "Mandi API key is not configured on the server."}), 503
    data = request.json
    state = data.get('state')
    commodity = data.get('commodity')
    district = data.get('district')

    if not state or not commodity:
        return jsonify({"error": "State and commodity are required."}), 400
    params = {
        'api-key': DATA_GOV_API_KEY,
        'format': 'json',
        'filters[state]': state,       # <-- 'state' (lowercase)
        'filters[commodity]': commodity, # <-- 'commodity' (lowercase)
        'limit': 50 # 50 results kaafi hain
    }
    if district:
        params['filters[district]'] = district

    try:
        response = requests.get(MANDI_API_URL, params=params)
        if response.status_code != 200:
            print(f"Mandi API Error: {response.text}")
            return jsonify({"error": "Failed to fetch data from Mandi API."}), 502

        mandi_data = response.json()
        records = mandi_data.get('records', [])

        if not records:
            return jsonify([])
        simplified_prices = []
        for record in records:
            simplified_prices.append({
                "mandi": record.get('market'),
                "district": record.get('district'),
                "price": record.get('modal_price'),
                "date": record.get('arrival_date'),  # <-- NAYA DATA
                "variety": record.get('variety'),    # <-- NAYA DATA
                "min_price": record.get('min_price'),  # <-- NAYA DATA
                "max_price": record.get('max_price')   # <-- NAYA DATA
            })
        return jsonify(simplified_prices)

    except requests.exceptions.RequestException as e:
        print(f"Mandi API Request Exception: {e}")
        return jsonify({"error": "Could not connect to Mandi API service."}), 504
    except Exception as e:
        print(f"Mandi Data Processing Error: {e}")
        return jsonify({"error": "Error processing Mandi data."}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)