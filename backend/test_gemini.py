import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("❌ GEMINI_API_KEY not found in .env")
    exit()

client = genai.Client(api_key=api_key)

# Try models in order of preference
models_to_try = [
    "gemini-2.0-flash",
    "gemini-2.5-flash", 
    "gemini-flash-latest",
    "gemini-pro-latest"
]

for model_name in models_to_try:
    try:
        print(f"🔄 Trying {model_name}...")
        response = client.models.generate_content(
            model=model_name,
            contents="Say 'Gemini API is working!'"
        )
        print(f"✅ SUCCESS with {model_name}!")
        print(f"Response: {response.text}")
        break
    except Exception as e:
        print(f"❌ {model_name} failed: {e}")
else:
    print("\n💡 All models failed. Try these:")
    print("  - gemini-2.0-flash (recommended)")
    print("  - gemini-2.5-flash")
    print("  - gemini-flash-latest")