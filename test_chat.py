import requests
import time

try:
    print("Testing chat API...")
    res = requests.post("http://127.0.0.1:8000/api/chat", json={"message": "I need a cool jacket for winter."})
    print(res.status_code)
    data = res.json()
    print("Reply:", data.get("reply"))
    print("Image URL:", data.get("image_url"))
    
    img_url = data.get("image_url")
    if img_url:
        print("Testing image URL...")
        img_res = requests.get(img_url, timeout=10)
        print("Image Status:", img_res.status_code)
        print("Content Type:", img_res.headers.get("content-type"))
except Exception as e:
    print(f"Error: {e}")
