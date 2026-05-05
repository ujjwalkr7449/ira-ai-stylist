from huggingface_hub import InferenceClient

api_key = "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"
client = InferenceClient("black-forest-labs/FLUX.1-schnell", token=api_key)

try:
    print("Generating image...")
    image = client.text_to_image("young Asian bride in pastel pink frock, elegant hairstyle fashion photography")
    image.save("test_hf_flux.jpg")
    print("Saved test_hf_flux.jpg")
except Exception as e:
    print(f"Error: {e}")
