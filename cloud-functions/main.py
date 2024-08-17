import sys
from ultralytics import YOLO
import requests
from PIL import Image
from io import BytesIO
from flask import Flask, request, jsonify

app = Flask(__name__)

model_path = 'best.pt'
model = YOLO(model_path)

@app.route('/', methods=['POST', 'OPTIONS'])
def predict_potholes():
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
        return ('', 204, headers)

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

        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }

        return jsonify(response_data), 200, headers

    except Exception as e:
        error_response = {
            'error': str(e)
        }

        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }

        return jsonify(error_response), 500, headers

def predict_potholes_handler(request):
    return predict_potholes()
