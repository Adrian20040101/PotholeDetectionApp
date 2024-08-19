from flask import Flask, request, jsonify, make_response
from ultralytics import YOLO
import requests
from PIL import Image
from io import BytesIO
from PIL.ExifTags import TAGS, GPSTAGS

app = Flask(__name__)

model_path = 'best.pt'
model = YOLO(model_path)

def get_exif_data(image):
    exif_data = {}
    try:
        info = image._getexif()
        if info:
            for tag, value in info.items():
                tag_name = TAGS.get(tag, tag)
                if tag_name == 'GPSInfo':
                    gps_data = {}
                    for t in value:
                        sub_tag_name = GPSTAGS.get(t, t)
                        gps_data[sub_tag_name] = value[t]
                    exif_data['GPSInfo'] = gps_data
    except Exception as e:
        print(f"Error getting EXIF data: {e}")
    return exif_data

def get_coordinates(exif_data):
    gps_info = exif_data.get("GPSInfo")
    if not gps_info:
        return None

    def _convert_to_degress(value):
        d0 = value[0][0] / float(value[0][1])
        d1 = value[1][0] / float(value[1][1])
        d2 = value[2][0] / float(value[2][1])
        return d0 + (d1 / 60.0) + (d2 / 3600.0)

    lat = None
    lon = None
    if gps_info:
        gps_latitude = gps_info.get("GPSLatitude")
        gps_latitude_ref = gps_info.get('GPSLatitudeRef')
        gps_longitude = gps_info.get("GPSLongitude")
        gps_longitude_ref = gps_info.get('GPSLongitudeRef')

        if gps_latitude and gps_latitude_ref and gps_longitude and gps_longitude_ref:
            lat = _convert_to_degress(gps_latitude)
            if gps_latitude_ref != "N":
                lat = 0 - lat

            lon = _convert_to_degress(gps_longitude)
            if gps_longitude_ref != "E":
                lon = 0 - lon

    return lat, lon

@app.route('/', methods=['POST'])
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

        # extract EXIF data
        exif_data = get_exif_data(img)
        lat, lon = get_coordinates(exif_data)

        results = model.predict(source=img, conf=0.25)

        pothole_detected = any(result.boxes.shape[0] > 0 for result in results)

        response_data = {
            'pothole_detected': pothole_detected,
            'latitude': lat,
            'longitude': lon,
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
