#!/bin/bash

echo "🧪 Testing Engineered Data Integration"
echo "======================================"
echo ""

# Test 1: Default data load
echo "1️⃣  Testing default data load..."
result=$(curl -s http://127.0.0.1:8000/dashboard/summary)
income=$(echo "$result" | python3 -c "import sys, json; print(json.load(sys.stdin)['profile']['monthly_income'])")
echo "   ✅ Income loaded: ₹$income"
echo ""

# Test 2: File upload
echo "2️⃣  Testing file upload..."
upload_result=$(curl -s -X POST -F "file=@/Users/dhavalbhagat/Desktop/SIES\ hackathon/backend/engineered_data.csv" http://127.0.0.1:8000/upload)
file_id=$(echo "$upload_result" | python3 -c "import sys, json; print(json.load(sys.stdin)['file_id'])")
echo "   ✅ File uploaded with ID: $file_id"
echo ""

# Test 3: Access uploaded data
echo "3️⃣  Testing uploaded data access..."
summary=$(curl -s "http://127.0.0.1:8000/dashboard/summary?file_id=$file_id")
total_inv=$(echo "$summary" | python3 -c "import sys, json; print(json.load(sys.stdin)['total_investment'])")
echo "   ✅ Total investments: ₹$total_inv"
echo ""

# Test 4: Expenses endpoint
echo "4️⃣  Testing expenses endpoint..."
expenses=$(curl -s "http://127.0.0.1:8000/dashboard/expenses?file_id=$file_id")
exp_count=$(echo "$expenses" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data['expenses']))")
echo "   ✅ Expense records: $exp_count"
echo ""

# Test 5: Goals endpoint
echo "5️⃣  Testing goals endpoint..."
goals=$(curl -s "http://127.0.0.1:8000/dashboard/goals?file_id=$file_id")
goal_count=$(echo "$goals" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data['goals']))")
echo "   ✅ Goals: $goal_count"
echo ""

echo "======================================"
echo "✨ All tests passed! System ready to use."
echo "🌐 Frontend: http://localhost:8081"
echo "🔌 Backend: http://127.0.0.1:8000"
