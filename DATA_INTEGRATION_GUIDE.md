# Integrating AI Agent with Dynamic Data

## What I've Set Up

Your application now has a complete data pipeline:

### 1. **Backend Data Layer** (`backend/data_loader.py`)
- Loads user financial data from JSON files
- Provides methods to query expenses, investments, goals, and monthly history
- Falls back to sample data if no file exists

### 2. **Backend API Endpoints** (`backend/main.py`)
New endpoints available:
- `GET /dashboard/summary` - Overall financial summary
- `GET /dashboard/expenses` - Expense breakdown by category
- `GET /dashboard/investments` - Investment portfolio
- `GET /dashboard/goals` - Financial goals with progress
- `GET /dashboard/history` - Monthly financial history
- `GET /dashboard/analytics` - AI-generated analytics with insights
- `POST /ask` - Ask the AI agent a financial question

### 3. **Frontend Data Hook** (`frontend/src/hooks/use-dashboard-data.ts`)
- `useDashboardData()` - Fetches all dashboard data from backend
- `askAgent(query, userId)` - Ask the AI agent a question

### 4. **Updated Dashboard** (`frontend/src/pages/Dashboard.tsx`)
- Now uses real data from the backend
- Displays dynamic values based on user data

## How to Use

### Step 1: Start Your Backend
```bash
cd backend
python3 -m uvicorn main:app --reload
```
The API will be available at `http://localhost:8000`

### Step 2: Start Your Frontend
```bash
cd frontend
npm run dev
```

### Step 3: Add Your Own Data
Create a file: `backend/user_data/default.json`

Example structure:
```json
{
  "user_id": "default",
  "profile": {
    "name": "Your Name",
    "email": "email@example.com",
    "monthly_income": 100000
  },
  "expenses": [
    {"date": "2024-12-01", "category": "Food & Dining", "amount": 5000},
    {"date": "2024-12-05", "category": "Travel", "amount": 2000}
  ],
  "investments": [
    {"type": "Fixed Deposit", "amount": 100000, "annual_return": 6.0},
    {"type": "Mutual Fund", "amount": 50000, "annual_return": 12.0}
  ],
  "goals": [
    {"name": "Emergency Fund", "target": 500000, "current": 200000, "deadline": "2025-12-31"}
  ],
  "monthly_history": [
    {"month": "Dec", "income": 100000, "expense": 50000, "investment": 30000}
  ]
}
```

## How the AI Agent Works

Now your AI agent can:

1. **Analyze Real Data**: When you ask a question, it accesses your actual financial data
2. **Generate Insights**: The RAG system retrieves financial knowledge and combines it with your data
3. **Provide Recommendations**: Based on patterns in your data

Example queries:
- "Analyze my investment portfolio"
- "Should I increase my emergency fund?"
- "How much am I spending on food?"
- "What's my monthly cashflow?"

## Next Steps

1. **Add Database**: Replace JSON files with a database (PostgreSQL, MongoDB, etc.)
2. **User Authentication**: Add login so each user has their own data
3. **Transaction Import**: Connect to bank APIs to auto-import transactions
4. **More Analytics Pages**: Use the same pattern to update Expenses, Investments, Goals, etc.
5. **Webhooks**: Update data in real-time when new transactions occur

## File Structure

```
backend/
├── data_loader.py (NEW) - Data management
├── main.py (UPDATED) - New API endpoints
├── financial_calculator_agent.py
├── rag.py
├── gemini_client.py
└── requirements.txt

frontend/
├── src/
│   ├── hooks/
│   │   └── use-dashboard-data.ts (NEW) - Data fetching hook
│   └── pages/
│       └── Dashboard.tsx (UPDATED) - Uses real data
```

## API Examples

### Get Dashboard Summary
```bash
curl http://localhost:8000/dashboard/summary
```

### Get Expenses
```bash
curl http://localhost:8000/dashboard/expenses
```

### Ask Agent a Question
```bash
curl -X POST http://localhost:8000/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "How much am I spending on food?", "user_id": "default"}'
```
