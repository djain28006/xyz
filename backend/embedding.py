from gemini_client import get_gemini_client
from config import EMBEDDING_MODEL

def get_embedding(text: str):
    client = get_gemini_client()
    response = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=text
    )
    return response.embeddings[0].values
