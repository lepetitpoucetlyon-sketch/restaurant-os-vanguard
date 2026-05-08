import os
import anthropic

client = anthropic.Anthropic(api_key="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")

models = [
    "claude-3-5-sonnet-20241022",
    "claude-3-5-sonnet-20240620",
    "claude-3-5-sonnet-latest",
    "claude-3-5-haiku-20241022",
    "claude-3-opus-20240229"
]

for model in models:
    try:
        print(f"Testing {model}...")
        message = client.messages.create(
            model=model,
            max_tokens=10,
            messages=[
                {"role": "user", "content": "Hello"}
            ]
        )
        print(f"  ✅ Success: {model}")
    except Exception as e:
        print(f"  ❌ Failed {model}: {e}")
