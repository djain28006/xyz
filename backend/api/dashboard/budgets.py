import json

def handler(request):
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json"
        },
        "body": json.dumps({
            "budgets": [
                {
                    "name": "Food",
                    "budget": 12000,
                    "spent": 14500,
                    "icon": "🍔"
                },
                {
                    "name": "Transport",
                    "budget": 4000,
                    "spent": 2800,
                    "icon": "🚌"
                },
                {
                    "name": "Shopping",
                    "budget": 6000,
                    "spent": 7200,
                    "icon": "🛍️"
                }
            ]
        })
    }
