import os
import io
import numpy as np
from flask import Flask, request, jsonify
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

load_dotenv() # Load environment variables from .env file like API keys

# Suppress TensorFlow warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'



# --- 1. MODEL BUILDING LOGIC (Aapka code) --- 
# def create_model(num_classes=19, image_size=(300, 300)):
#     base_model = EfficientNetB3(
#         input_shape=(image_size[0], image_size[1], 3),
#         include_top=False,
#         weights=None
#     )
#     base_model.trainable = False
#     inputs = Input(shape=(image_size[0], image_size[1], 3))
#     x = base_model(inputs, training=False)
#     x = GlobalAveragePooling2D()(x)
#     x = Dense(1024, activation='relu')(x)
#     x = Dropout(0.5)(x)
#     predictions = Dense(num_classes, activation='softmax')(x)
#     model = Model(inputs=inputs, outputs=predictions)
#     return model

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
# print("Creating model structure...")
# model = create_model(num_classes=len(CLASS_NAMES), image_size=IMAGE_SIZE)
# print("Model structure created.")
# print(f"Loading weights from: {MODEL_WEIGHTS_PATH}")
# model.load_weights(MODEL_WEIGHTS_PATH)
# print("Model weights loaded successfully! Server is ready.")
# Global variable for the model, initially None
disease_model = None
model_loading_error = None # To store loading error

# Function to load the model when needed
def get_disease_interpreter():
    global disease_interpreter, model_loading_error
    if disease_interpreter is not None: return disease_interpreter
    if model_loading_error is not None: return None

    print("Attempting to load TFLite model interpreter (Lazy Load)...")
    try:
        # Use tf.lite.Interpreter (works for both tflite-runtime and full tensorflow)
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

@app.route('/', methods=['GET'])
def home():
    return "Fasal Sarthi Backend Server is running!"

@app.route('/predict_disease', methods=['POST'])
def handle_prediction():
    # Get the interpreter
    interpreter = get_disease_interpreter()
    if interpreter is None:
         error_msg = str(model_loading_error) if model_loading_error else "Disease model could not be loaded."
         return jsonify({"error": f"Model loading failed: {error_msg}"}), 503

    # Get input/output details
    try:
        input_details = interpreter.get_input_details()
        output_details = interpreter.get_output_details()
    except Exception as e:
         print(f"Error getting interpreter details: {e}")
         return jsonify({"error": "Failed to get model input/output details."}), 500

    # --- File handling (same as before) ---
    if 'file' not in request.files: return jsonify({"error": "No file part key found"}), 400
    file = request.files.get('file')
    if not file or file.filename == '': return jsonify({"error": "No selected file"}), 400

    try:
        # --- Preprocessing (Ensure dtype and shape match model input) ---
        image_bytes = file.read()
        img = Image.open(io.BytesIO(image_bytes)).convert('RGB')

        # Get target shape from model details
        input_shape = input_details[0]['shape'] # e.g., [1, 300, 300, 3]
        target_height = input_shape[1]
        target_width = input_shape[2]
        img = img.resize((target_width, target_height))

        img_array = tf.keras.preprocessing.image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)

        # Ensure input dtype matches
        input_dtype = input_details[0]['dtype'] # e.g., np.float32 or np.uint8
        img_array = img_array.astype(input_dtype)

        # Handle normalization/quantization
        # Check if the model expects input between 0-1, -1 to 1, or 0-255 (quantized)
        input_scale, input_zero_point = input_details[0].get('quantization', (1.0, 0)) # Default for float models

        if input_dtype == np.float32 and input_scale == 1.0 and input_zero_point == 0:
             # Common case: Normalize float input to 0-1
             img_array = img_array / 255.0
        elif input_dtype == np.uint8:
             # Quantized model - no normalization needed if input is already 0-255
             pass # Assuming img_to_array gives 0-255
        # Add other normalization logic if needed (e.g., /127.5 - 1.0 for -1 to 1)

        # --- Prediction using TFLite Interpreter ---
        interpreter.set_tensor(input_details[0]['index'], img_array)
        interpreter.invoke() # Run inference
        predictions = interpreter.get_tensor(output_details[0]['index'])

        # Dequantize output if necessary
        output_scale, output_zero_point = output_details[0].get('quantization', (1.0, 0))
        if output_details[0]['dtype'] == np.uint8: # If output is quantized
            predictions = (predictions.astype(np.float32) - output_zero_point) * output_scale

        # --- Post-processing (same as before) ---
        predicted_class_index = np.argmax(predictions[0])
        # Add safety check for index out of bounds
        if predicted_class_index >= len(CLASS_NAMES):
             print(f"ERROR: Predicted index {predicted_class_index} out of bounds for CLASS_NAMES (len {len(CLASS_NAMES)})")
             return jsonify({"error": "Model prediction resulted in invalid class index."}), 500
        predicted_class_name = CLASS_NAMES[predicted_class_index]
        confidence = float(np.max(predictions[0])) # Note: Confidence might need adjustment after dequantization
        return jsonify({
            "predicted_disease": predicted_class_name,
            "confidence": f"{confidence * 100:.2f}%"
        })

    except Exception as e:
        print(f"Prediction error with TFLite model: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Error processing image with TFLite model"}), 500

''''--------------------------- CROP RECOMMENDATION MODEL -----------------------------------------'''
    
# --- 4. CROP RECOMMENDATION MODEL LOADING ---
CROP_MODEL_STACKING_PATH = 'best_stacking_model_final.joblib'
CROP_SCALER_PATH = 'scaler_final.joblib'
CROP_ENCODER_FINAL_PATH = 'encoder_final.joblib'

# --- FINAL FEATURE LIST & CATEGORICAL OPTIONS (from Colab output) ---
# The exact 25 features the model expects IN ORDER
# NOTE: The numerical features must still match the scaler's input order for scaling step
CROP_FULL_FEATURE_NAMES = [
    'soil_ph', 'nitrogen_kg_ha', 'phosphorus_kg_ha', 'potassium_kg_ha', 'annual_rainfall_mm', 'avg_temp_c', 'avg_humidity_pct', # 7 Numerical
    'soil_type_Black (Vertisol)', 'soil_type_Laterite', 'soil_type_Loamy', 'soil_type_Red', 'soil_type_Sandy', # 5 Soil Types (Missing Alluvial?)
    'irrigation_type_Drip', 'irrigation_type_Groundwater', 'irrigation_type_Mixed', 'irrigation_type_Rainfed', 'irrigation_type_Sprinkler', # 5 Irrigation Types (Missing Canal, Tank?)
    'previous_crop_Dal', 'previous_crop_Fallow', 'previous_crop_Ganna', 'previous_crop_Makka', 'previous_crop_Moongfali', 'previous_crop_Rice', 'previous_crop_Sarson', 'previous_crop_Wheat' # 8 Previous Crops
]

# Numerical features list (for scaling step - order must match scaler)
CROP_NUMERICAL_FEATURES = CROP_FULL_FEATURE_NAMES[:7]

# Categorical options derived *only* from the model's feature names
# Use sorted lists for consistency when creating OHE columns later
POSSIBLE_SOIL_TYPES = sorted(['Black (Vertisol)', 'Laterite', 'Loamy', 'Red', 'Sandy'])
POSSIBLE_IRRIGATION_TYPES = sorted(['Drip', 'Groundwater', 'Mixed', 'Rainfed', 'Sprinkler'])
POSSIBLE_PREVIOUS_CROPS = sorted(['Dal', 'Fallow', 'Ganna', 'Makka', 'Moongfali', 'Rice', 'Sarson', 'Wheat'])

try:
    crop_model_stacking = joblib.load(CROP_MODEL_STACKING_PATH)
    crop_scaler = joblib.load(CROP_SCALER_PATH)
    crop_encoder_final = joblib.load(CROP_ENCODER_FINAL_PATH)

    # Validate scaler features
    scaler_features = getattr(crop_scaler, 'feature_names_in_', CROP_NUMERICAL_FEATURES)
    if list(scaler_features) != CROP_NUMERICAL_FEATURES:
         print(f"CRITICAL WARNING: Scaler features {list(scaler_features)} do not match expected numerical {CROP_NUMERICAL_FEATURES}. Scaling might be incorrect!")
    else:
         print("Scaler features validated.")

    # Validate model features count
    model_features_count = getattr(crop_model_stacking, 'n_features_in_', None)
    if model_features_count and model_features_count != len(CROP_FULL_FEATURE_NAMES):
        print(f"CRITICAL WARNING: Model expects {model_features_count} features, but calculated list has {len(CROP_FULL_FEATURE_NAMES)}!")
    elif not model_features_count:
         print("Warning: Could not read n_features_in_ from model.")

    print(f"Model expects features in this order: {CROP_FULL_FEATURE_NAMES}")
    print("Crop Recommendation (Stacking) model, scaler, and encoder loaded.")

except Exception as e:
    crop_full_feature_names = []


# --- FINAL UPDATE: CROP RECOMMENDATION ENDPOINT (/recommend_crop) ---
@app.route('/recommend_crop', methods=['POST'])
# @token_required
def handle_crop_recommendation():
    if not crop_model_stacking or not crop_scaler or not crop_encoder_final or len(CROP_FULL_FEATURE_NAMES) != 25: # Check for 25
        return jsonify({"error": "Crop Recommendation model setup incorrect or not loaded."}), 500

    data = request.json
    print(f"Received data for crop rec: {data}")

    try:
        # 1. Prepare Input DataFrame matching the full expected features
        input_df = pd.DataFrame(columns=CROP_FULL_FEATURE_NAMES, index=[0]).fillna(0.0)

        # 2. Extract and Validate Numerical Features
        numerical_values_dict = {}
        for feature_name in CROP_NUMERICAL_FEATURES:
            if feature_name not in data: raise KeyError(f"Missing: {feature_name}")
            value = float(data[feature_name])
            input_df.loc[0, feature_name] = value # Store raw first
            numerical_values_dict[feature_name] = value

        # 3. Scale Numerical Features
        numerical_df_for_scaling = pd.DataFrame([numerical_values_dict], columns=CROP_NUMERICAL_FEATURES)
        scaled_numerical_values = crop_scaler.transform(numerical_df_for_scaling)
        input_df[CROP_NUMERICAL_FEATURES] = scaled_numerical_values # Put scaled back

        # 4. Extract and One-Hot Encode Categorical Features using EXACT model column names
        # Soil Type
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
            # Handle crops not explicitly in the model's feature list (treat as 'Other'/all zeros)
            print(f"Warning: Received previous_crop '{previous_crop}' not in model features, treating as 'Other'.")
            # If model strictly requires one of the known crops, raise ValueError instead.

        # 5. Ensure final DataFrame has the correct column order (already ensured by DataFrame creation)
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


# ... (Existing model loading code for Disease, CropRec) ...

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

# ... (Existing Flask App logic, routes for /, /predict_disease, /sarthi_ai_chat, /recommend_crop, /get_weather) ...

# --- 9. NEW FERTILIZER RECOMMENDATION ENDPOINT ---
@app.route('/recommend_fertilizer', methods=['POST'])
def handle_fertilizer_recommendation():
    if not fert_model or not fert_model_columns or not fert_encoder:
        return jsonify({"error": "Fertilizer Recommendation model is not loaded."}), 500

    data = request.json

    # Expected numerical features from model_columns.joblib (check names carefully)
    # Example names, adjust based on your actual columns:
    num_features = ['Temparature', 'Humidity', 'Moisture', 'Nitrogen', 'Potassium', 'Phosphorous']
    
    # Expected categorical features (from model_columns.joblib)
    soil_prefix = 'Soil_Type_'
    crop_prefix = 'Crop_Type_'

    try:
        # Create a dictionary for the input, starting with numerical values
        input_data = {feat: float(data[feat]) for feat in num_features if feat in data}

        # Get the Soil Type and Crop Type from input
        soil_type = data.get('Soil_Type')
        crop_type = data.get('Crop_Type')

        if not soil_type or not crop_type:
             raise KeyError("Missing Soil_Type or Crop_Type in input")

        # --- One-Hot Encode Categorical Features ---
        # Create a DataFrame with columns matching the trained model, initialized to 0
        input_df = pd.DataFrame(columns=fert_model_columns, index=[0]).fillna(0)

        # Fill in the numerical values we received
        for key, value in input_data.items():
            if key in input_df.columns:
                 input_df.loc[0, key] = value

        # Set the correct Soil_Type column to 1
        soil_col_name = soil_prefix + soil_type
        if soil_col_name in input_df.columns:
            input_df.loc[0, soil_col_name] = 1
        else:
             raise ValueError(f"Unknown Soil_Type: {soil_type}")

        # Set the correct Crop_Type column to 1
        crop_col_name = crop_prefix + crop_type
        if crop_col_name in input_df.columns:
            input_df.loc[0, crop_col_name] = 1
        else:
            raise ValueError(f"Unknown Crop_Type: {crop_type}")
            
        # Ensure the order matches exactly (should already match if created correctly)
        input_final = input_df[fert_model_columns]

        # --- Make Prediction ---
        prediction_encoded = fert_model.predict(input_final)
        
        # Decode the prediction using the label encoder
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



# --- CHATBOT SETUP (Direct API Call) ---
# --- CHATBOT SETUP ---
# Load key from environment variable
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
if not GOOGLE_API_KEY:
    print("ERROR: GOOGLE_API_KEY environment variable not set!")
    # Optionally exit or handle the error
# Hum 'v1beta' URL ka use karenge (jo API keys support karta hai)
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key={GOOGLE_API_KEY}"

chat_prompt_context = """
    Aap 'Fasal Sarthi' hain, ek expert AI assistant jo kheti-baadi (farming) mein kisaano ki madad karte hain. 
    Aapke jawaab hamesha simple, helpful aur kheti se related hone chahiye. 
    Agar koi kheti se alag sawaal (jaise 'movie kaunsi dekhein?') pooche, 
    toh aap politely mana kar dein ki 'Main sirf kheti se jude sawaalon ka jawaab de sakta hoon.'
"""
print("Gemini AI Chatbot (Direct API) is ready.")


# --- CHATBOT ENDPOINT (Direct API Call) ---
@app.route('/sarthi_ai_chat', methods=['POST'])
def handle_chat():
    data = request.json
    user_message = data.get('message')
    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    try:
        # Google API ke liye JSON payload
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": chat_prompt_context},
                        {"text": f"User: {user_message}\nBot:"}
                    ]
                }
            ]
        }
        headers = {"Content-Type": "application/json"}

        # 'requests' library se POST call
        response = requests.post(GEMINI_API_URL, headers=headers, data=json.dumps(payload))
        
        if response.status_code != 200:
            print(f"Error from Google API: {response.text}")
            raise Exception("Google API returned an error")

        response_data = response.json()
        bot_response = response_data['candidates'][0]['content']['parts'][0]['text']
        
        return jsonify({"response": bot_response})

    except Exception as e:
        print(f"Error during chat generation: {e}")
        return jsonify({"error": "Failed to generate AI response"}), 500


# --- 6. WEATHER API SETUP ---
OWM_API_KEY = os.getenv('OWM_API_KEY')
if not OWM_API_KEY:
    print("ERROR: OWM_API_KEY environment variable not set!")
    # Optionally exit or handle the error
OWM_API_URL = "https://api.openweathermap.org/data/2.5/weather"

# --- 7. NAYA WEATHER ENDPOINT ---
# --- 7. NAYA WEATHER ENDPOINT (Updated for Lat/Lon) ---
@app.route('/get_weather', methods=['POST'])
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
        
        # --- NAYA DATA EXTRACTION ---
        main = weather_data.get('main', {})
        wind = weather_data.get('wind', {})
        weather_desc = weather_data.get('weather', [{}])[0]
        sys_data = weather_data.get('sys', {})
        clouds = weather_data.get('clouds', {})
        visibility = weather_data.get('visibility') # Meters
        
        # Convert Timestamps (Sunrise/Sunset) to Local Time
        # Assuming server runs in IST (UTC+5:30) - Adjust if needed
        ist_offset = timedelta(hours=5, minutes=30)
        sunrise_ts = sys_data.get('sunrise')
        sunset_ts = sys_data.get('sunset')
        sunrise_local = datetime.fromtimestamp(sunrise_ts + weather_data.get('timezone', 0), timezone.utc).astimezone(timezone(ist_offset)).strftime('%I:%M %p') if sunrise_ts else 'N/A'
        sunset_local = datetime.fromtimestamp(sunset_ts + weather_data.get('timezone', 0), timezone.utc).astimezone(timezone(ist_offset)).strftime('%I:%M %p') if sunset_ts else 'N/A'

        # Convert Wind Direction (Degrees to Cardinal)
        def deg_to_cardinal(deg):
            if deg is None: return 'N/A'
            dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
            ix = round(deg / (360. / len(dirs)))
            return dirs[ix % len(dirs)]
        
        wind_direction = deg_to_cardinal(wind.get('deg'))

        # Extract Rain (handle missing key)
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
        
        # Remove keys with None values (optional, for cleaner JSON)
        simplified_data = {k: v for k, v in simplified_data.items() if v is not None}

        return jsonify(simplified_data)

    except Exception as e:
        print(f"Error during detailed weather fetch: {e}")
        return jsonify({"error": "Failed to fetch detailed weather data"}), 500

# if __name__ == '__main__':
#     app.run(debug=True, host='0.0.0.0', port=5000)