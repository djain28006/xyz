import json
import csv
from datetime import datetime, timedelta
from typing import Dict, List, Any
import os

class DataLoader:
    """Load and manage user financial data"""
    
    def __init__(self, user_id: str = "default"):
        self.user_id = user_id
        # Use /tmp on Vercel for temporary file access
        base_dir = "/tmp/user_data" if os.environ.get("VERCEL") else "user_data"
        self.data_file = f"{base_dir}/{user_id}.json"
        self.data = self.load_user_data()
    
    def load_user_data(self) -> Dict[str, Any]:
        """Load user data from JSON file, engineered CSV, or return sample data"""
        try:
            if os.path.exists(self.data_file):
                with open(self.data_file, 'r') as f:
                    return json.load(f)
        except Exception as e:
            print(f"Error loading data: {e}")
        
        # Try loading from engineered_data.csv (module-relative) or legacy engineered_data.csv
        try:
            engineered_path = os.path.join(os.path.dirname(__file__), "engineered_data.csv")
            if os.path.exists(engineered_path):
                return self.load_from_engineered_csv(engineered_path)
            if os.path.exists("engineered_data.csv"):
                # legacy filename support (cwd-based)
                return self.load_from_engineered_csv(os.path.abspath("engineered_data.csv"))
        except Exception as e:
            print(f"Error loading engineered data: {e}")
        
        # Return sample data if file doesn't exist
        return self.get_sample_data()
    
    def load_from_engineered_csv(self, path: str) -> Dict[str, Any]:
        """Load and parse the engineered CSV file at relative or absolute `path`"""
        rows = []
        try:
            with open(path, mode='r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                # Normalize fieldnames to lowercase
                reader.fieldnames = [name.lower().strip() for name in reader.fieldnames] if reader.fieldnames else []
                for row in reader:
                    rows.append(row)
        except Exception as e:
            print(f"Failed to read CSV at {path}: {e}")
            return self.get_sample_data()

        # We will treat consecutive rows as a time series for "Monthly History".
        # Let's take up to 12 rows to simulate the last year.
        
        num_rows = len(rows)
        if num_rows == 0:
            return self.get_sample_data()
        
        # Take up to 12 rows for history
        history_limit = 12
        history_rows = rows[:history_limit]
        
        # Generate month labels ending with current month (Dec)
        # 12 months ago to now
        # from datetime import datetime # Already imported
        # import calendar # Not used
        
        # We want the LAST entry in our list to be the CURRENT month.
        # So we iterate backwards from now.
        
        current_date = datetime.now()
        monthly_history = []
        
        # Expense categories mapping (CSV column -> Display Name)
        # Based on: Rent,Loan_Repayment,Insurance,Groceries,Transport,Eating_Out,Entertainment,Utilities,Healthcare,Education,Miscellaneous
        cat_map = {
            'rent': 'Rent & EMI',
            'loan_repayment': 'Rent & EMI', # Grouping for cleaner UI
            'insurance': 'Insurance',
            'groceries': 'Food & Dining',
            'eating_out': 'Food & Dining',
            'transport': 'Travel',
            'entertainment': 'Entertainment',
            'utilities': 'Utilities',
            'healthcare': 'Healthcare', 
            'education': 'Education',
            'miscellaneous': 'Shopping', # Mapping misc to shopping/others
            'savings': 'Investments'     # This is our investment amount
        }
        
        # We need to construct the history list. 
        # history_rows row 0 = This Month (latest). row 1 = Last Month.
        # So we iterate `history_rows` and assign months backwards.
        
        latest_row = history_rows[0]
        
        # Build Monthly History (chronological for charts)
        # We need to reverse the slice so index 0 is the oldest, and last index is current month.
        chronological_rows = history_rows[::-1]
        
        for i, row in enumerate(chronological_rows):
            # Calculate month offset: (len - 1 - i) months ago
            months_ago = len(chronological_rows) - 1 - i
            dt = current_date - timedelta(days=30 * months_ago)
            month_name = dt.strftime("%b") # Jan, Feb
            
            income = float(row.get('income', 0))
            
            # Calculate total expense from columns
            total_exp = float(row.get('total_expenses', 0))
            # If total_expenses missing, sum specific columns
            if total_exp == 0:
                 for col in cat_map.keys():
                     if col != 'savings' and col in row: # Check if column exists in the row
                         total_exp += float(row.get(col, 0))
            
            investment = float(row.get('savings', 0))
            
            monthly_history.append({
                "month": month_name,
                "income": income,
                "expense": total_exp,
                "investment": investment
            })

        # --- Data for "Current Month" (Dashboard Summary) ---
        current_data_row = latest_row
        current_income = float(current_data_row.get('income', 0))
        current_savings = float(current_data_row.get('savings', 0))
        
        # Calculate current total expenses breakdown
        current_expenses_list = []
        transaction_log = [] # detailed list for Expenses page
        
        for csv_col, display_cat in cat_map.items():
            if csv_col == 'savings': continue
            
            if csv_col in latest_row:
                amt = float(current_data_row.get(csv_col, 0))
                if amt > 0:
                    current_expenses_list.append({
                        "category": display_cat,
                        "amount": amt,
                        "date": current_date.strftime("%Y-%m-%d") # Hardcode to today for summary
                    })
                    
                    # Add to transaction log as individual items
                    # We can vary the date slightly to make it realistic
                    # E.g. Rent on 1st, Utilities on 10th
                    day_offset = (hash(csv_col) % 20) + 1
                    trans_date = (current_date.replace(day=1) + timedelta(days=day_offset)).strftime("%Y-%m-%d")
                    
                    transaction_log.append({
                        "id": hash(csv_col + trans_date), # simple fake ID
                        "date": trans_date,
                        "description": f"Payment for {csv_col.replace('_', ' ').title()}",
                        "category": display_cat.lower().split(' ')[0], # map to badge type: food, travel etc
                        "amount": amt
                    })

        # Sort transactions by date desc
        transaction_log.sort(key=lambda x: x['date'], reverse=True)
        
        # --- Profile ---
        profile = {
            "name": "User", # No name in CSV usually
            "email": "user@finance.com",
            "monthly_income": current_income,
             # Infer from columns if exist
            "occupation": str(current_data_row.get('occupation', 'Professional')),
            "age": int(current_data_row.get('age', 30))
        }

        # --- Goals ---
        # Derive goals from financial health
        goals = [
            {
                "id": 1,
                "name": "Emergency Fund", 
                "target": current_income * 6, 
                "saved": current_savings * 5, 
                "deadline": "2026-03-01",
                "icon": "🛡️"
            },
            {
                "id": 2,
                "name": "Retirement Corpus", 
                "target": 20000000, 
                "saved": float(current_data_row.get('savings', 0)) * 20, 
                "deadline": "2045-01-01",
                "icon": "👴"
            }
        ]
        
        # --- Investments Recommendations ---
        # Generate recommendations based on risk profile (age & income)
        # Frontend expects: id, name, type, expectedReturns, risk, timeHorizon, minInvestment, description
        
        # Simple risk logic: Young (<35) -> High, Middle (35-50) -> Medium, Old (>50) -> Low
        age = profile["age"]
        risk_profile = "high" if age < 35 else "medium" if age < 50 else "low"
        
        # Pool of potential investments
        all_investments = [
             {
                "id": 1,
                "name": "Nifty 50 Index Fund",
                "type": "SIP",
                "expectedReturns": "12-14%",
                "risk": "medium",
                "timeHorizon": "5+ years",
                "minInvestment": 500,
                "description": "Diversified exposure to India's top 50 companies. Ideal for long-term wealth creation."
            },
            {
                "id": 2,
                "name": "HDFC Mid-Cap Fund",
                "type": "Mutual Fund",
                "expectedReturns": "14-16%",
                "risk": "high",
                "timeHorizon": "7+ years",
                "minInvestment": 1000,
                "description": "Higher growth potential with mid-sized companies. Suitable for aggressive investors."
            },
            {
                "id": 3,
                "name": "SBI Fixed Deposit",
                "type": "Fixed Deposit",
                "expectedReturns": "6.5-7%",
                "risk": "low",
                "timeHorizon": "1-5 years",
                "minInvestment": 10000,
                "description": "Guaranteed returns with capital protection. Best for conservative investors."
            },
            {
                "id": 4,
                "name": "Axis Bluechip Fund",
                "type": "Mutual Fund",
                "expectedReturns": "10-12%",
                "risk": "low",
                "timeHorizon": "3+ years",
                "minInvestment": 500,
                "description": "Invests in large-cap, stable companies. Lower volatility with steady returns."
            },
             {
                "id": 5,
                "name": "PPF Account",
                "type": "Government Scheme",
                "expectedReturns": "7.1%",
                "risk": "low",
                "timeHorizon": "15 years",
                "minInvestment": 500,
                "description": "Tax-free returns with sovereign guarantee. Great for retirement planning."
            },
            {
                "id": 6,
                "name": "Parag Parikh Flexi Cap",
                "type": "Mutual Fund",
                "expectedReturns": "13-15%",
                "risk": "medium",
                "timeHorizon": "5+ years",
                "minInvestment": 1000,
                "description": "Flexible allocation across market caps. Good for balanced portfolios."
            }
        ]
        
        # Filter or sort based on calculated risk profile? 
        # For now, just return all but maybe highlight one. 
        investments = all_investments

        # --- Subscriptions ---
        # Frontend expects: id, name, cost, nextRenewal, category, logo, isActive, recommendation
        # We'll infer these from the expense categories present in the CSV.
        
        subscriptions = []
        sub_id_counter = 1
        
        # Helper to create sub
        def add_sub(name, cost, cat, logo, active=True, rec=None):
            nonlocal sub_id_counter
            # Randomize renewal date within next 30 days
            days_in_future = (hash(name) % 30) + 1
            renewal_date = (current_date + timedelta(days=days_in_future)).strftime("%Y-%m-%d")
            
            subscriptions.append({
                "id": sub_id_counter,
                "name": name,
                "cost": cost,
                "nextRenewal": renewal_date,
                "category": cat,
                "logo": logo,
                "isActive": active,
                "recommendation": rec 
            })
            sub_id_counter += 1

        # Check if we have expenses in key categories
        has_entertainment = any(x['category'] == 'Entertainment' for x in current_expenses_list)
        has_utilities = any(x['category'] == 'Utilities' for x in current_expenses_list)
        has_shopping = any(x['category'] == 'Shopping' for x in current_expenses_list)
        has_health = any(x['category'] == 'Healthcare' for x in current_expenses_list)
        
        if has_entertainment:
            add_sub("Netflix", 649, "Entertainment", "🎬", True, "keep")
            add_sub("Spotify", 119, "Music", "🎵", True, "keep")
            # Maybe add one to cancel?
            add_sub("Hotstar", 499, "Entertainment", "⭐", True, "cancel")
            
        if has_shopping:
            add_sub("Amazon Prime", 299, "Shopping", "📦", True, "keep")
            
        if has_utilities:
             add_sub("Google One", 130, "Cloud", "☁️", True, "keep")
             
        if has_health:
            add_sub("Gym Membership", 1500, "Health", "💪", False, "cancel")
            
        if not subscriptions: # Fallback if no matching expenses found
            add_sub("Netflix", 649, "Entertainment", "🎬", True, "keep")



        # --- Budgets ---
        # Logic: 
        # Budget = Average of previous months for that category (or 80% of income distributed if no history)
        # Spent = Current month actuals
        
        budgets_list = []
        
        # Calculate average spending per category from history (excluding current/latest month if possible)
        # chronological_rows has all history. Let's use it.
        # But we need granular category data for history rows. 
        # The `monthly_history` list only has total expense.
        # We need to scan `history_rows` (which is the last 12-N rows) to get category averages.
        
        # category totals across all parsed history rows
        category_sums = {}
        history_count = len(history_rows)
        
        for row in history_rows:
            for csv_col in cat_map.keys():
                if csv_col == 'savings': continue
                if csv_col in row:
                    val = float(row.get(csv_col, 0))
                    category_sums[csv_col] = category_sums.get(csv_col, 0) + val
                    
        # Create budget objects
        budget_id_counter = 1

        # We need to aggregate by DISPLAY category to match UI
        ui_category_stats = {} # { "Food": { budget_sum, spent_sum } }
        
        # 1. Calculate 'Spent' (Current Month)
        for csv_col, display_cat in cat_map.items():
            if csv_col == 'savings': continue
            if csv_col in latest_row:
                current_val = float(latest_row.get(csv_col, 0))
                
                # For Budget (Average from history)
                total_val = category_sums.get(csv_col, 0)
                avg_val = total_val / history_count if history_count > 0 else current_val
                
                # Add 10% buffer to budget to make it "allowable"
                target_budget = avg_val * 1.0
                
                if display_cat not in ui_category_stats:
                    ui_category_stats[display_cat] = {"budget": 0, "spent": 0}
                
                ui_category_stats[display_cat]["budget"] += target_budget
                ui_category_stats[display_cat]["spent"] += current_val

        # Icons map
        icon_map = {
            "Food & Dining": "🍔",
            "Travel": "🚗",
            "Entertainment": "🎬",
            "Shopping": "🛍️",
            "Utilities": "💡",
            "Healthcare": "🏥",
            "Rent & EMI": "🏠",
            "Insurance": "🛡️",
            "Education": "📚"
        }

        for cat_name, stats in ui_category_stats.items():
            if stats["spent"] > 0 or stats["budget"] > 0:
                budgets_list.append({
                    "id": budget_id_counter,
                    "name": cat_name,
                    "budget": round(stats["budget"]),
                    "spent": round(stats["spent"]),
                    "icon": icon_map.get(cat_name, "💰")
                })
                budget_id_counter += 1

        # --- Insights Generation ---
        # Generate actionable insights based on data
        insights = []
        insight_id = 1
        
        def add_insight(title, desc, type_, value=None, trend=None, percentage=None):
            nonlocal insight_id
            insights.append({
                "id": insight_id,
                "title": title,
                "description": desc,
                "type": type_,
                "value": value,
                "trend": trend,
                "percentage": percentage
            })
            insight_id += 1

        # 1. Savings Rate Insight
        savings_rate = (current_savings / current_income) * 100 if current_income > 0 else 0
        if savings_rate > 20:
            add_insight(
                "Great savings progress!",
                f"You've saved {current_savings:,.0f} this month, keeping a healthy savings rate of {savings_rate:.1f}%. Keep it up!",
                "positive",
                trend="up",
                percentage=int(savings_rate - 20) # Dummy comparative metric
            )
        elif savings_rate < 5:
             add_insight(
                "Low savings rate",
                "Your savings are lower than recommended (20%). Review your discretionary spending.",
                "warning",
                value=f"{savings_rate:.1f}% rate"
            )

        # 2. Category Spending Trends (Current vs Avg)
        # We reused `ui_category_stats` from Budget section which has {budget (avg), spent (current)}
        for cat_name, stats in ui_category_stats.items():
            spent = stats["spent"]
            avg = stats["budget"] # Budget is essentially the average
            
            if avg > 0:
                diff_percent = ((spent - avg) / avg) * 100
                
                # Significant increase (> 20%)
                if diff_percent > 20 and spent > 1000:
                    add_insight(
                        f"{cat_name} expenses increased",
                        f"Your {cat_name} expenses went up by {int(diff_percent)}% compared to your average. Consider cutting back.",
                        "negative",
                        trend="up",
                        percentage=int(diff_percent)
                    )
                # Significant decrease (< -20%)
                elif diff_percent < -20 and spent > 1000:
                    add_insight(
                        f"{cat_name} expenses down",
                        f"Your {cat_name} expenses decreased by {abs(int(diff_percent))}% this month. Great job optimizing!",
                        "positive",
                        trend="down",
                        percentage=abs(int(diff_percent))
                    )

        # 3. Subscriptions Optimization
        cancellable_subs = [s for s in subscriptions if s.get("recommendation") == "cancel"]
        if cancellable_subs:
            total_save = sum(s["cost"] for s in cancellable_subs)
            sub_names = ", ".join([s["name"] for s in cancellable_subs[:3]])
            add_insight(
                "Subscription optimization",
                f"You can save {total_save}/month by cancelling unused subscriptions: {sub_names}.",
                "tip",
                value=f"{total_save}/mo"
            )

        # 4. Emergency Fund Goal
        ef_goal = next((g for g in goals if "Emergency" in g["name"]), None)
        if ef_goal:
            remaining = ef_goal["target"] - ef_goal["saved"]
            if remaining > 0:
                add_insight(
                    "Emergency fund milestone",
                    f"You're just {remaining:,.0f} away from your emergency fund goal.",
                    "positive",
                    value=f"{remaining:,.0f} left"
                )
        
        # 5. Investment Opportunity (if savings are high)
        if current_savings > 10000:
             add_insight(
                "Investment opportunity",
                "Based on your savings, you could invest 5,000/month in SIP for better returns.",
                "tip",
                value="5,000/mo"
            )

        # Fallback to sample data if lists are empty
        sample_data = self.get_sample_data()
        if not budgets_list:
            budgets_list = sample_data.get("budgets", [])
        if not subscriptions:
            subscriptions = sample_data.get("subscriptions", [])
        if not insights:
            insights = sample_data.get("insights", [])

        data = {
            "user_id": self.user_id,
            "profile": profile,
            "expenses": transaction_log, 
            "investments": investments,
            "goals": goals,
            "subscriptions": subscriptions, # New field
            "budgets": budgets_list, # New field
            "insights": insights, # New field
            "monthly_history": monthly_history,
            "loaded_from": os.path.abspath(path)
        }
        return data
    
    def get_sample_data(self) -> Dict[str, Any]:
        """Return sample financial data for demo purposes"""
        return {
            "user_id": self.user_id,
            "profile": {
                "name": "John Doe",
                "email": "john@example.com",
                "age": 32,
                "monthly_income": 85000
            },
            "expenses": [
                {"date": "2024-12-01", "category": "Food & Dining", "amount": 3500},
                {"date": "2024-12-01", "category": "Rent & EMI", "amount": 18000},
                {"date": "2024-12-05", "category": "Travel", "amount": 1200},
                {"date": "2024-12-10", "category": "Entertainment", "amount": 2000},
                {"date": "2024-12-15", "category": "Shopping", "amount": 1500},
                {"date": "2024-12-20", "category": "Utilities", "amount": 3500},
            ],
            "investments": [
                {"type": "Fixed Deposit", "amount": 13381, "annual_return": 6.0},
                {"type": "Mutual Fund", "amount": 17500, "annual_return": 12.0},
                {"type": "Stock", "amount": 22000, "annual_return": 15.0}
            ],
            "goals": [
                {"id": 1, "name": "Emergency Fund", "target": 300000, "saved": 204000, "deadline": "2025-12-31", "icon": "🛡️"},
                {"id": 2, "name": "Vacation", "target": 150000, "saved": 75000, "deadline": "2025-06-30", "icon": "✈️"},
                {"id": 3, "name": "Car Purchase", "target": 1000000, "saved": 250000, "deadline": "2026-12-31", "icon": "🚗"}
            ],
            "monthly_history": [
                {"month": "Jul", "income": 82000, "expense": 42000, "investment": 20000},
                {"month": "Aug", "income": 84000, "expense": 38000, "investment": 25000},
                {"month": "Sep", "income": 85000, "expense": 45000, "investment": 22000},
                {"month": "Oct", "income": 83000, "expense": 41000, "investment": 24000},
                {"month": "Nov", "income": 88000, "expense": 48000, "investment": 30000},
                {"month": "Dec", "income": 85000, "expense": 44500, "investment": 28000},
            ],
            "budgets": [
                {"id": 1, "name": "Food & Dining", "budget": 6000, "spent": 3500, "icon": "🍔"},
                {"id": 2, "name": "Rent & EMI", "budget": 18000, "spent": 18000, "icon": "🏠"},
                {"id": 3, "name": "Travel", "budget": 3000, "spent": 1200, "icon": "🚗"},
                {"id": 4, "name": "Entertainment", "budget": 1500, "spent": 2000, "icon": "🎬"},
                {"id": 5, "name": "Shopping", "budget": 5000, "spent": 1500, "icon": "🛍️"},
                {"id": 6, "name": "Utilities", "budget": 4000, "spent": 3500, "icon": "💡"},
            ],
            "subscriptions": [
                {"id": 1, "name": "Netflix", "cost": 649, "nextRenewal": "2025-01-15", "category": "Entertainment", "logo": "🎬", "isActive": True, "recommendation": "keep"},
                {"id": 2, "name": "Spotify", "cost": 119, "nextRenewal": "2025-01-20", "category": "Music", "logo": "🎵", "isActive": True, "recommendation": "keep"},
                {"id": 3, "name": "Gym", "cost": 1500, "nextRenewal": "2025-01-01", "category": "Health", "logo": "💪", "isActive": False, "recommendation": "cancel"},
            ],
            "insights": [
                {"id": 1, "title": "Great savings!", "description": "You saved 20% of your income this month.", "type": "positive", "value": "20%", "trend": "up"},
                {"id": 2, "title": "Entertainment over budget", "description": "You exceeded your entertainment budget by ₹500.", "type": "negative", "value": "-₹500", "trend": "up"},
            ]
        }
    
    def get_user_profile(self) -> Dict[str, Any]:
        """Get user profile"""
        return self.data.get("profile", {})
    
    def get_current_month_summary(self) -> Dict[str, Any]:
        """Get current month's summary"""
        monthly = self.data.get("monthly_history", [])
        if monthly:
            return monthly[-1]  # Latest month
        return {}
    
    def get_expense_summary(self) -> Dict[str, float]:
        """Get expense summary by category"""
        expenses = self.data.get("expenses", [])
        summary = {}
        for expense in expenses:
            category = expense.get("category", "Other")
            amount = expense.get("amount", 0)
            summary[category] = summary.get(category, 0) + amount
        return summary
    
    def get_investment_portfolio(self) -> List[Dict[str, Any]]:
        """Get investment portfolio"""
        return self.data.get("investments", [])
    
    def get_financial_goals(self) -> List[Dict[str, Any]]:
        """Get financial goals"""
        return self.data.get("goals", [])
    
    def calculate_total_investment(self) -> float:
        """Calculate total investment amount"""
        return sum(inv.get("amount", 0) for inv in self.get_investment_portfolio())
    
    def calculate_total_expenses(self) -> float:
        """Calculate total expenses"""
        return sum(exp.get("amount", 0) for exp in self.data.get("expenses", []))
    
    def save_user_data(self, data: Dict[str, Any]):
        """Save user data to file"""
        base_dir = "/tmp/user_data" if os.environ.get("VERCEL") else "user_data"
        os.makedirs(base_dir, exist_ok=True)
        with open(self.data_file, 'w') as f:
            json.dump(data, f, indent=2)
        self.data = data
