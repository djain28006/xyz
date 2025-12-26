import { useState, useEffect } from "react";

const API_BASE = "http://127.0.0.1:8000";

export function useDashboardData(fileId?: string) {
  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState(null);
  const [investments, setInvestments] = useState(null);
  const [goals, setGoals] = useState(null);
  const [history, setHistory] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Add file_id as query param if provided
        const queryParam = fileId ? `?file_id=${fileId}` : "";
        
        // Fetch with timeout
        const fetchWithTimeout = (url: string, timeout = 10000) => {
          return Promise.race([
            fetch(url),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Request timeout")), timeout)
            )
          ]);
        };
        
        // Fetch all endpoints but don't fail if some are slow
        const results = await Promise.allSettled([
          fetchWithTimeout(`${API_BASE}/dashboard/summary${queryParam}`),
          fetchWithTimeout(`${API_BASE}/dashboard/expenses${queryParam}`),
          fetchWithTimeout(`${API_BASE}/dashboard/investments${queryParam}`),
          fetchWithTimeout(`${API_BASE}/dashboard/goals${queryParam}`),
          fetchWithTimeout(`${API_BASE}/dashboard/history${queryParam}`),
          fetchWithTimeout(`${API_BASE}/dashboard/analytics${queryParam}`, 15000), // Analytics can take longer
        ]);

        // Process results safely (cast settled values to Response)
        const toResponse = (r: any): Response | null => {
          if (!r) return null;
          return r as Response;
        };

        const handleIndex = async (i: number, setter: (v: any) => void) => {
          const item = results[i];
          if (item && (item as PromiseFulfilledResult<any>).status === 'fulfilled') {
            const raw = (item as PromiseFulfilledResult<any>).value;
            const res = toResponse(raw);
            if (res && res.ok) {
              try {
                const js = await res.json();
                setter(js);
              } catch (e) {
                console.warn(`Failed to parse JSON for endpoint ${i}`, e);
              }
            }
          }
        };

        await Promise.all([
          handleIndex(0, setSummary),
          handleIndex(1, setExpenses),
          handleIndex(2, setInvestments),
          handleIndex(3, setGoals),
          handleIndex(4, setHistory),
          handleIndex(5, setAnalytics),
        ]);

        // Check if at least summary loaded
        if (results[0].status === "rejected") {
          throw new Error("Failed to fetch dashboard summary");
        }
      } catch (err) {
        const raw = err?.message || String(err);
        console.error("Error fetching dashboard data:", raw);

        if (raw.includes("API key not valid") || raw.includes("API_KEY_INVALID")) {
          setError(
            "AI service not available: invalid or missing Gemini API key. Add a valid GEMINI_API_KEY to backend/.env and restart the server."
          );
        } else {
          setError(raw);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fileId]);

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
