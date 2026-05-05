import requests
API_URL = "https://api-inference.huggingface.co/models/prompthero/openjourney"
headers = {"Authorization": f"Bearer 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"}

def query(payload):
	response = requests.post(API_URL, headers=headers, json=payload)
	return response

output = query({
	"inputs": "Astronaut riding a horse",
})

print(output.status_code)
if output.status_code == 200:
    print("Success")
else:
    print(output.text)
