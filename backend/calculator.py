def budget_allocation(income: float):
    return {
        "needs": income * 0.5,
        "wants": income * 0.3,
        "savings": income * 0.2
    }

def emergency_fund(monthly_expenses: float):
    return {
        "recommended_fund": monthly_expenses * 6
    }

def debt_payoff(principal: float, annual_interest_rate: float, monthly_payment: float):
    monthly_rate = annual_interest_rate / 12 / 100
    balance = principal
    months = 0
    total_interest = 0.0

    while balance > 0 and months < 1000:
        interest = balance * monthly_rate
        total_interest += interest
        balance += interest - monthly_payment
        months += 1

    return {
        "months_to_payoff": months,
        "total_interest": total_interest
    }

def investment_growth(principal: float, annual_return_rate: float, years: int):
    future_value = principal * ((1 + annual_return_rate / 100) ** years)
    return {
        "future_value": future_value
    }

def mortgage_payment(loan_amount: float, annual_interest_rate: float, years: int):
    r = annual_interest_rate / 12 / 100
    n = years * 12

    monthly_payment = loan_amount * r * (1 + r) ** n / ((1 + r) ** n - 1)
    total_cost = monthly_payment * n

    return {
        "monthly_payment": monthly_payment,
        "total_cost": total_cost,
        "total_interest": total_cost - loan_amount
    }
