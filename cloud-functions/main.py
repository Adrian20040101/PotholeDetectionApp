from flask import Flask, request, jsonify, make_response
from ultralytics import YOLO
import requests
from PIL import Image
from io import BytesIO

app = Flask(__name__)

model_path = 'best.pt'
model = YOLO(model_path)

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
