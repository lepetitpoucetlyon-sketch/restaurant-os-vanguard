import os
from google import genai

client = genai.Client(api_key="AIzaSyAqtiBxLeoE37LQdh02D2dnD6zIdzHIF-o")
for m in client.models.list():
    print(f"{m.name}: {m.supported_methods}")
