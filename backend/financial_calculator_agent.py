import json
import re
from gemini_client import get_gemini_client
from config import TEXT_MODEL
from calculator import *

def financial_calculator(query: str):
    prompt = f"""
You are a financial calculator assistant.

Determine which financial function to call and extract numeric parameters.

Return ONLY valid JSON.
No markdown. No explanations outside JSON.

Query:
{query}
"""

    client = get_gemini_client()
    response = client.models.generate_content(
        model=TEXT_MODEL,
        contents=prompt
    )

    try:
        # Clean Gemini output
        response_text = response.text.strip()
        response_text = re.sub(r"```json|```", "", response_text).strip()

        parsed = json.loads(response_text)

        raw_function = parsed.get("function") or parsed.get("function_name")

        # Map Gemini function names to internal functions
        FUNCTION_ALIASES = {
            "budget": "budget_allocation",
            "budgeting": "budget_allocation",
            "emergency": "emergency_fund",
            "emergency_fund": "emergency_fund",
            "debt": "debt_payoff",
            "debt_payoff": "debt_payoff",
            "investment": "investment_growth",
            "invest": "investment_growth",
            "mortgage": "mortgage_payment",
            "loan": "mortgage_payment"
        }

        function_name = FUNCTION_ALIASES.get(raw_function, raw_function)

        raw_params = parsed.get("parameters", {})

        # Allowed parameters per function
        PARAM_WHITELIST = {
            "budget_allocation": {"income"},
            "emergency_fund": {"monthly_expenses"},
            "debt_payoff": {"principal", "annual_interest_rate", "monthly_payment"},
            "investment_growth": {"principal", "annual_return_rate", "years"},
            "mortgage_payment": {"loan_amount", "annual_interest_rate", "years"},
        }

        # Apply whitelist
        allowed_keys = PARAM_WHITELIST.get(function_name, set())
        parameters = {k: v for k, v in raw_params.items() if k in allowed_keys}


        if not function_name:
            return {"error": "No function detected"}

        if function_name == "budget_allocation":
            result = budget_allocation(**parameters)
        elif function_name == "emergency_fund":
            result = emergency_fund(**parameters)
        elif function_name == "debt_payoff":
            result = debt_payoff(**parameters)
        elif function_name == "investment_growth":
            result = investment_growth(**parameters)
        elif function_name == "mortgage_payment":
            result = mortgage_payment(**parameters)
        else:
            return {"error": f"Unknown function: {function_name}"}

        return {
            "function_name": function_name,
            "parameters": parameters,
            "result": result
        }

    except Exception as e:
        return {
            "error": "Failed to parse or execute financial calculation",
            "raw_response": response.text,
            "exception": str(e)
        }
