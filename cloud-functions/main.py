from flask import Flask, request, jsonify, make_response
from ultralytics import YOLO
import requests
from PIL import Image
from io import BytesIO
from PIL.ExifTags import TAGS, GPSTAGS

app = Flask(__name__)

model_path = 'best.pt'
model = YOLO(model_path)

def get_gps_info(exif_data):
    if not exif_data:
        return None
    
    gps_info = {}
    for tag, value in exif_data.items():
        decoded = TAGS.get(tag, tag)
        if decoded == "GPSInfo":
            for t in value:
                sub_decoded = GPSTAGS.get(t, t)
                gps_info[sub_decoded] = value[t]
    return gps_info

def convert_to_degrees(value):
    """Convert GPS coordinates from EXIF data to degrees format"""
    d = float(value[0])
    m = float(value[1]) / 60.0
    s = float(value[2]) / 3600.0
    return d + m + s

def extract_coordinates(gps_info):
    """Extract latitude and longitude from GPSInfo dictionary"""
    if 'GPSLatitude' in gps_info and 'GPSLongitude' in gps_info:
        lat = convert_to_degrees(gps_info['GPSLatitude'])
        lon = convert_to_degrees(gps_info['GPSLongitude'])

        # Handle the direction (N/S, E/W)
        if gps_info.get('GPSLatitudeRef') == 'S':
            lat = -lat
        if gps_info.get('GPSLongitudeRef') == 'W':
            lon = -lon

        return lat, lon
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
        image_url = request_json['imageUrl']

        response = requests.get(image_url)
        img = Image.open(BytesIO(response.content))

        exif_data = img._getexif()
        gps_info = get_gps_info(exif_data)
        coordinates = extract_coordinates(gps_info) if gps_info else None

        results = model.predict(source=img, conf=0.25)

        pothole_detected = any(result.boxes.shape[0] > 0 for result in results)

        response_data = {
            'pothole_detected': pothole_detected,
            'message': 'Potholes were detected in the image.' if pothole_detected else 'No potholes detected in the image.'
        }

        response = make_response(jsonify(response_data), 200)
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'POST'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'

        return response

    except Exception as e:
        error_response = {
            'error': str(e)
        }
        response = make_response(jsonify(error_response), 500)
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'POST'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'

        return response

def predict_potholes_handler(request):
    return predict_potholes()
