import sys

from ultralytics import YOLO
import requests
from PIL import Image
from io import BytesIO

# define the model path and confidence threshold
model_path = 'best.pt'
confidence_threshold = 0.25

# load the YOLO model
model = YOLO(model_path)


# function to download the image from a given URL
def download_image(url):
    response = requests.get(url)
    if response.status_code == 200:
        img = Image.open(BytesIO(response.content))
        return img
    else:
        raise Exception("Failed to download image")


# retrieve URL of the image from firebase storage dynamically
image_url = sys.argv[1]

# download the image from the URL
image = download_image(image_url)

# run the prediction on the downloaded image
results = model.predict(source=image, conf=confidence_threshold)

# check if potholes are detected
if len(results) > 0 and results[0].boxes.shape[0] > 0:
    print("Potholes were detected in the image.")
else:
    print("No potholes detected in the image.")
