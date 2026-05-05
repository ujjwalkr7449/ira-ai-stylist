import requests

API_URL = "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5"
api_key = "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"
headers = {"Authorization": f"Bearer {api_key}"}
payload = {"inputs": "young Asian bride in pastel pink frock, elegant hairstyle fashion photography"}

response = requests.post(API_URL, headers=headers, json=payload)
print(response.status_code)
if response.status_code != 200:
    print(response.text)
else:
    print("Success, saving image")
    with open("test_img.jpg", "wb") as f:
        f.write(response.content)
