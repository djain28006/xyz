import csv
import json
from io import StringIO, BytesIO
from typing import Dict, Any, List
from datetime import datetime, timedelta
import random
import openpyxl

class FileParser:
    """Parse CSV/Excel financial data into standardized format"""
    
    @staticmethod
    def parse_file(file_content, filename: str) -> Dict[str, Any]:
        """
        Parse CSV or Excel data and convert to financial data structure
        """
        try:
            rows = []
            if filename.endswith('.csv'):
                if isinstance(file_content, bytes):
                    file_content = file_content.decode('utf-8')
                f = StringIO(file_content)
                reader = csv.DictReader(f)
                reader.fieldnames = [col.lower().strip() for col in reader.fieldnames] if reader.fieldnames else []
                rows = list(reader)
                fieldnames = reader.fieldnames
            elif filename.endswith(('.xlsx', '.xls')):
                if isinstance(file_content, str):
                    file_content = file_content.encode()
                wb = openpyxl.load_workbook(BytesIO(file_content), data_only=True)
                sheet = wb.active
                fieldnames = [str(cell.value).lower().strip() for cell in sheet[1]]
                for excel_row in sheet.iter_rows(min_row=2, values_only=True):
                    row_dict = dict(zip(fieldnames, excel_row))
                    rows.append(row_dict)
            else:
                raise ValueError("Unsupported file format. Please upload CSV or Excel file.")
            
            # Initialize base data structure
            data = {
                "user_id": "uploaded",
                "profile": {"name": "User", "email": "user@example.com", "monthly_income": 85000},
                "expenses": [],
                "investments": [],
                "goals": [],
                "monthly_history": []
            }
            
            # Check if this is an engineered dataset
            engineered_cols = {'income', 'rent', 'groceries', 'transport', 'eating_out', 'utilities', 'healthcare'}
            if engineered_cols.issubset(set(fieldnames)):
                return FileParser._parse_engineered_data(rows, fieldnames, data)
            
            # Parse expenses
            if all(col in fieldnames for col in ['date', 'category', 'amount']):
                for row in rows:
                    data["expenses"].append({
                        "date": str(row['date']),
                        "category": str(row['category']),
                        "amount": float(row['amount'])
                    })
            
            # Parse investments
            elif all(col in fieldnames for col in ['type', 'amount']) and 'return' in fieldnames:
                for row in rows:
                    data["investments"].append({
                        "type": str(row['type']),
                        "amount": float(row['amount']),
                        "annual_return": float(row.get('return', 0))
                    })
            
            # Parse goals
            elif all(col in fieldnames for col in ['name', 'target', 'current']):
                for row in rows:
                    data["goals"].append({
                        "name": str(row['name']),
                        "target": float(row['target']),
                        "current": float(row['current']),
                        "deadline": str(row.get('deadline', '2025-12-31'))
                    })
            
            return data
        
        except Exception as e:
            raise ValueError(f"Error parsing file: {str(e)}")
    
    @staticmethod
    def _parse_engineered_data(rows: List[Dict[str, Any]], fieldnames: List[str], data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse the engineered financial dataset format"""
        if not rows:
            return data
            
        sample_row = rows[0]
        monthly_income = float(sample_row.get('income', 85000))
        data["profile"]["monthly_income"] = monthly_income
        
        expense_categories = [
            'rent', 'loan_repayment', 'insurance', 'groceries', 'transport',
            'eating_out', 'entertainment', 'utilities', 'healthcare', 'education',
            'miscellaneous'
        ]
        
        base_date = datetime.now() - timedelta(days=90)
        for idx, row in enumerate(rows):
            for category in expense_categories:
                if category in row:
                    try:
                        amount = float(row.get(category, 0))
                        if amount > 0:
                            date = base_date + timedelta(days=(idx % 90))
                            data["expenses"].append({
                                "date": date.strftime("%Y-%m-%d"),
                                "category": category.replace('_', ' ').title(),
                                "amount": amount
                            })
                    except: continue
        
        if 'savings' in row:
            for idx, row in enumerate(rows):
                try:
                    savings = float(row.get('savings', 0))
                    if savings > 0:
                        data["investments"].append({
                            "type": ["Stocks", "Mutual Funds", "Fixed Deposits", "Gold"][idx % 4],
                            "amount": savings,
                            "annual_return": random.uniform(5, 15)
                        })
                except: continue
        
        data["goals"] = [
            {"name": "Emergency Fund", "target": monthly_income * 6, "current": monthly_income * 3, "deadline": (datetime.now() + timedelta(days=365)).strftime("%Y-%m-%d")},
            {"name": "Vacation", "target": 200000, "current": 50000, "deadline": (datetime.now() + timedelta(days=180)).strftime("%Y-%m-%d")},
            {"name": "Home Down Payment", "target": 1000000, "current": 200000, "deadline": (datetime.now() + timedelta(days=730)).strftime("%Y-%m-%d")}
        ]
        return data
    
    @staticmethod
    def format_for_display(data: Dict[str, Any]) -> Dict[str, Any]:
        """Transform parsed data into dashboard-ready format"""
        monthly_history = {}
        for expense in data.get("expenses", []):
            try:
                # Try relative date parsing fallback
                date_str = expense.get("date", "")
                try:
                    dt = datetime.strptime(date_str, "%Y-%m-%d")
                except:
                    dt = datetime.now() # Fallback
                
                month = dt.strftime("%b")
                if month not in monthly_history:
                    monthly_history[month] = {"month": month, "income": 0, "expense": 0, "investment": 0}
                monthly_history[month]["expense"] += expense.get("amount", 0)
            except:
                pass
        
        total_investments = sum(inv.get("amount", 0) for inv in data.get("investments", []))
        
        return {
            "expenses": data.get("expenses", []),
            "investments": data.get("investments", []),
            "goals": data.get("goals", []),
            "monthly_history": list(monthly_history.values()),
            "total_investments": total_investments,
            "profile": data.get("profile", {})
        }
