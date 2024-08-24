from flask import Flask, request, jsonify, make_response
from ultralytics import YOLO
import requests
from PIL import Image, ExifTags
from io import BytesIO

app = Flask(__name__)

model_path = 'best.pt'
model = YOLO(model_path)

def get_exif_data(image):
    """Extract EXIF data from an image."""
    try:
        exif_data = image._getexif()
        if not exif_data:
            raise ValueError("No EXIF data found.")
        return {
            ExifTags.TAGS.get(k, k): v
            for k, v in exif_data.items()
            if k in ExifTags.TAGS
        }
    except Exception as e:
        print(f"Error extracting EXIF data: {e}")
        return None

def extract_coordinates(exif_data):
    """Extract and convert GPS coordinates to decimal degrees."""
    try:
        if not exif_data or 'GPSInfo' not in exif_data:
            raise ValueError("No GPSInfo found in EXIF data.")

        gps_info = exif_data['GPSInfo']
        
        lat_tuple = gps_info.get(2)
        lng_tuple = gps_info.get(4)
        lat_ref = gps_info.get(1)
        lng_ref = gps_info.get(3)

        # validate GPS tuples
        if not lat_tuple or not lng_tuple or len(lat_tuple) != 3 or len(lng_tuple) != 3:
            raise ValueError("Invalid GPS data format.")

        # convert to decimal degrees
        lat = (lat_tuple[0] + lat_tuple[1] / 60 + lat_tuple[2] / 3600)
        lng = (lng_tuple[0] + lng_tuple[1] / 60 + lng_tuple[2] / 3600)

        # apply hemisphere
        if lat_ref == 'S':
            lat = -lat
        if lng_ref == 'W':
            lng = -lng

        lat = float(lat)
        lng = float(lng)

        return lat, lng
    except Exception as e:
        print(f"Error extracting coordinates: {e}")
        return None

@app.route('/', methods=['POST', 'OPTIONS'])
def predict_potholes():
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return response
    
    try:
        request_json = request.get_json()
        image_url = request_json.get('imageUrl')

        if not image_url:
            raise ValueError("No image URL provided.")

        response = requests.get(image_url)
        img = Image.open(BytesIO(response.content))

        exif_data = get_exif_data(img)
        coordinates = extract_coordinates(exif_data)

        results = model.predict(source=img, conf=0.25)
        pothole_detected = any(result.boxes.shape[0] > 0 for result in results)

        if pothole_detected and not coordinates:
            response_data = {
                'pothole_detected': True,
                'coordinates': None,
                'message': 'Pothole detected, but no GPS location found. Please input manually.'
        }
        else:
            response_data = {
                'pothole_detected': pothole_detected,
                'coordinates': coordinates,
                'message': 'No potholes detected in the image.' if not pothole_detected else 'Pothole detected, GPS coordinates found.'
        }

        response = make_response(jsonify(response_data), 200)
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'POST'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'

        return response

    except Exception as e:
        print(f"Error processing request: {e}")
        error_response = {
            'error': str(e),
            'message': 'An error occurred during processing. Please try again or provide manual input.'
        }
        response = make_response(jsonify(error_response), 500)
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'POST'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'

        return response

def predict_potholes_handler(request):
    return predict_potholes()
