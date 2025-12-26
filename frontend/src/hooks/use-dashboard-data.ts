import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";

// Use environment variable for backend URL
const API_BASE = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";

export function useDashboardData(fileId?: string) {
  const [summary, setSummary] = useState<any>(null);
  const [expenses, setExpenses] = useState<any>(null); // Use any for now or define interface
  // ... existing state ...
  const [investments, setInvestments] = useState(null);
  const [goals, setGoals] = useState(null);
  const [history, setHistory] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // ... existing Promise.all logic for API calls ...
        // Fetch with timeout
        const fetchWithTimeout = (url: string, timeout = 10000) => {
          return Promise.race([
            fetch(url),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Request timeout")), timeout)
            )
          ]);
        };

        const results = await Promise.allSettled([
          fetchWithTimeout(`${API_BASE}/dashboard/summary${fileId ? `?file_id=${fileId}` : ""}`),
          fetchWithTimeout(`${API_BASE}/dashboard/expenses${fileId ? `?file_id=${fileId}` : ""}`),
          fetchWithTimeout(`${API_BASE}/dashboard/investments${fileId ? `?file_id=${fileId}` : ""}`),
          fetchWithTimeout(`${API_BASE}/dashboard/goals${fileId ? `?file_id=${fileId}` : ""}`),
          fetchWithTimeout(`${API_BASE}/dashboard/history${fileId ? `?file_id=${fileId}` : ""}`),
          fetchWithTimeout(`${API_BASE}/dashboard/analytics${fileId ? `?file_id=${fileId}` : ""}`, 15000),
        ]);

        const processResult = async (result: PromiseSettledResult<any>) => {
          if (result.status === 'fulfilled' && result.value.ok) {
            try {
              return await result.value.json();
            } catch (e) {
              console.warn("JSON parse error", e);
              return null;
            }
          }
          return null;
        };

        const [
          summaryData,
          expensesData,
          investmentsData,
          goalsData,
          historyData,
          analyticsData
        ] = await Promise.all(results.map(processResult));


        // FETCH REAL DATA FROM FIRESTORE
        let userSalary = 0;
        let monthlyExpenseTotal = 0;
        let realExpensesList: any[] = [];

        // Structures for aggregation
        const categoryMap: Record<string, number> = {};
        const monthMap: Record<string, number> = {};

        const user = auth.currentUser;

        if (user) {
          try {
            // 1. Fetch Salary
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              userSalary = userSnap.data().monthly_income || 0;
            }

            // 2. Fetch ALL Expenses (for History & Categories)
            const expensesRef = collection(db, "users", user.uid, "expenses");
            const q = query(expensesRef, orderBy("date", "desc"));
            const expensesSnap = await getDocs(q);

            const today = new Date();
            const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM

            expensesSnap.forEach(doc => {
              const d = doc.data();
              const amt = Number(d.amount) || 0;
              const dateStr = d.date; // YYYY-MM-DD

              // Current Month Calculation
              if (dateStr && dateStr.startsWith(currentMonthKey)) {
                monthlyExpenseTotal += amt;
                realExpensesList.push({ id: doc.id, ...d });
              }

              // Category Aggregation
              if (d.category) {
                categoryMap[d.category] = (categoryMap[d.category] || 0) + amt;
              }

              // History Aggregation (Month Name)
              if (dateStr) {
                const dateObj = new Date(dateStr);
                const monthName = dateObj.toLocaleString('default', { month: 'short' });
                monthMap[monthName] = (monthMap[monthName] || 0) + amt;
              }
            });

          } catch (err) {
            console.error("Error fetching Firestore data", err);
          }
        }

        // Build History Array for Chart (Sort by Month order)
        const monthsOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const realHistoryList = Object.entries(monthMap).map(([month, expense]) => ({
          month,
          expense
        })).sort((a, b) => monthsOrder.indexOf(a.month) - monthsOrder.indexOf(b.month));

        // Merge Firestore data into summary
        const finalSummary = summaryData ? {
          ...summaryData,
          profile: {
            ...summaryData.profile,
            monthly_income: userSalary > 0 ? userSalary : (summaryData.profile?.monthly_income || 0)
          },
          summary: {
            ...summaryData.summary,
            expenses: Object.keys(categoryMap).length > 0 ? categoryMap : summaryData?.summary?.expenses
          },
          total_expenses: monthlyExpenseTotal
        } : {
          profile: { monthly_income: userSalary },
          total_expenses: monthlyExpenseTotal,
          summary: { expenses: categoryMap }
        };

        // Merge real expenses into expensesData
        const finalExpenses = expensesData ? {
          ...expensesData,
          expenses: realExpensesList.length > 0 ? realExpensesList : expensesData.expenses
        } : { expenses: realExpensesList };

        // Override history with real data
        const finalHistory = realHistoryList.length > 0 ? { history: realHistoryList } : historyData;

        setSummary(finalSummary);
        setExpenses(finalExpenses);
        setInvestments(investmentsData);
        setGoals(goalsData);
        setHistory(finalHistory);
        setAnalytics(analyticsData);

      } catch (err: any) {
        console.error("Error fetching dashboard data:", err);
        setError(err.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fileId]); // Re-run when fileId changes

  return {
    summary,
    expenses,
    investments,
    goals,
    history,
    analytics,
    loading,
    error,
  };
}

export async function askAgent(query: string, userId: string = "default") {
  try {
    const response = await fetch(`${API_BASE}/ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, user_id: userId }),
    });

    if (!response.ok) {
      const t = await response.text();
      throw new Error(t || "Failed to get response");
    }
    return await response.json();
  } catch (err) {
    console.error("Error asking agent:", err);
    throw err;
  }
}
