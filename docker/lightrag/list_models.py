import os
from google import genai

api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    print("ERROR: GEMINI_API_KEY not set")
    exit(1)

client = genai.Client(api_key=api_key, http_options={"api_version": "v1beta"})
print("Listing models...")
try:
    for m in client.models.list():
        print(f" - {m.name}")
except Exception as e:
    print(f"EXCEPTION: {e}")
print("Done.")
