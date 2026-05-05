import requests
import os

API_URL = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell"
api_key = "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"
headers = {"Authorization": f"Bearer {api_key}"}
payload = {"inputs": "young Asian bride in pastel pink frock, elegant hairstyle fashion photography"}

response = requests.post(API_URL, headers=headers, json=payload)
print(response.status_code)
if response.status_code != 200:
    print(response.text)
else:
    print("Success")
