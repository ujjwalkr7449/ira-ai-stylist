from huggingface_hub import InferenceClient
import traceback

api_key = "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"
client = InferenceClient("runwayml/stable-diffusion-v1-5", token=api_key)

try:
    print("Generating image...")
    image = client.text_to_image("young Asian bride in pastel pink frock, elegant hairstyle fashion photography")
    image.save("test_hf_sd.jpg")
    print("Saved test_hf_sd.jpg")
except Exception as e:
    print("Error:")
    traceback.print_exc()
