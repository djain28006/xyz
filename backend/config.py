import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# Allow startup without key, will fail only on AI calls

# Models confirmed available for your API key
TEXT_MODEL = "models/gemini-2.0-flash"
EMBEDDING_MODEL = "models/text-embedding-004"
