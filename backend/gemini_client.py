from google import genai
from config import GEMINI_API_KEY

def get_gemini_client():
    # Lazy initialization (safe for runtime)
    return genai.Client(api_key=GEMINI_API_KEY)
