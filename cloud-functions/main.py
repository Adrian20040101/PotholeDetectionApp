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
    exif_data = image._getexif()
    if not exif_data:
        return None
    return {
        ExifTags.TAGS[k]: v
        for k, v in exif_data.items()
        if k in ExifTags.TAGS
    }

def extract_coordinates(exif_data):
    """Extract and convert GPS coordinates to decimal degrees."""
    if not exif_data or 'GPSInfo' not in exif_data:
        return None

    gps_info = exif_data['GPSInfo']
    
    north = gps_info[2]
    east = gps_info[4]

    lat = ((((north[0] * 60) + north[1]) * 60) + north[2]) / 60 / 60
    lng = ((((east[0] * 60) + east[1]) * 60) + east[2]) / 60 / 60
    lat = float(lat)
    lng = float(lng)

    lat_ref = gps_info.get(1)
    lng_ref = gps_info.get(3)

    if lat_ref == 'S':
        lat = -lat
    if lng_ref == 'W':
        lng = -lng

    return lat, lng

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

        exif_data = get_exif_data(img)

        coordinates = extract_coordinates(exif_data)

        results = model.predict(source=img, conf=0.25)

        pothole_detected = any(result.boxes.shape[0] > 0 for result in results)

        response_data = {
            'pothole_detected': pothole_detected,
            'coordinates': coordinates,
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
