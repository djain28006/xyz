import os
from gemini_client import get_gemini_client
from config import TEXT_MODEL
import logging

logger = logging.getLogger(__name__)

def get_financial_advice_with_rag(question: str):
    """
    Generate financial advice. 
    Note: Dynamic RAG (ChromaDB) removed to meet Vercel size limits.
    """
    
    prompt = f"""
You are a financial advisor. Provide expert guidance on the user's question.

Question:
{question}

Answer clearly in markdown.
"""

    client = get_gemini_client()
    try:
        response = client.models.generate_content(
            model=TEXT_MODEL,
            contents=prompt
        )
        return {
            "response": response.text,
            "sources": ["AI General Knowledge"]
        }
    except Exception as e:
        logger.exception("Advice generation failed")
        return {"error": "AI generation failed: %s" % str(e)}
