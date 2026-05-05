import requests

try:
    print("Testing chat API for saree...")
    res = requests.post("http://127.0.0.1:8000/api/chat", json={"message": "I am a girl 19 year wedding suggestion sharee"})
    data = res.json()
    print("Reply:", data.get("reply"))
    print("Image URL:", data.get("image_url"))
    
    img_url = data.get("image_url")
    if img_url:
        print("Testing image URL...")
        img_res = requests.get(img_url, timeout=10)
        print("Image Status:", img_res.status_code)
        # print first few bytes to check if it's an image
        print("Content Type:", img_res.headers.get("content-type"))
except Exception as e:
    print(f"Error: {e}")
