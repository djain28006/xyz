import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Lightbulb, AlertTriangle, CheckCircle, IndianRupee } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

type InsightType = "positive" | "negative" | "warning" | "tip";

interface Insight {
  id: string; // Changed to string for flexibility
  title: string;
  description: string;
  type: InsightType;
  value?: string;
  trend?: "up" | "down";
  percentage?: number;
}

const typeConfig = {
  positive: {
    icon: CheckCircle,
    bgColor: "bg-success-soft",
    borderColor: "border-success/20",
    iconColor: "text-success",
  },
  negative: {
    icon: TrendingUp,
    bgColor: "bg-danger-soft",
    borderColor: "border-danger/20",
    iconColor: "text-danger",
  },
  warning: {
    icon: AlertTriangle,
    bgColor: "bg-warning-soft",
    borderColor: "border-warning/20",
    iconColor: "text-warning",
  },
  tip: {
    icon: Lightbulb,
    bgColor: "bg-info-soft",
    borderColor: "border-info/20",
    iconColor: "text-info",
  },
};

export default function Insights() {
  const { user } = useAuth();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [summary, setSummary] = useState({
    income: 0,
    expenses: 0,
    savings: 0,
    savingsRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch Budgets, Subscriptions, Goals (for future use?)
        const budgetsSnap = await getDocs(collection(db, "users", user.uid, "budgets"));
        const subsSnap = await getDocs(collection(db, "users", user.uid, "subscriptions"));
        // Assuming we might store income somewhere or just hardcode/estimate for now
        // For hackathon, let's estimate Income = (Total Budget + 20%) or allow user input (out of scope for now, will mock reasonable default)

        let totalBudget = 0;
        let totalSpent = 0;
        let totalSubs = 0;

        budgetsSnap.forEach(doc => {
          const data = doc.data();
          totalBudget += data.amount || 0;
          totalSpent += data.spent || 0;
        });

        subsSnap.forEach(doc => {
          const data = doc.data();
          if (data.isActive !== false) { // count only active
            totalSubs += data.cost || 0;
          }
        });

        // Add subscription cost to total expenses if not already tracked in budgets (assuming separate for now)
        const totalExpenses = totalSpent + totalSubs;

        // Fetch User Income
        let userIncome = 0;
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          userIncome = userDocSnap.data().monthly_income || 0;
        }

        // Fallback if 0 (e.g. user skipped onboarding or data error), though unlikely if flow is forced
        const incomeToUse = userIncome > 0 ? userIncome : Math.max(totalExpenses * 1.2, 50000);

        const savings = incomeToUse - totalExpenses;
        const savingsRate = incomeToUse > 0 ? Math.round((savings / incomeToUse) * 100) : 0;

        setSummary({
          income: incomeToUse,
          expenses: totalExpenses,
          savings: savings,
          savingsRate: savingsRate
        });

        // Generate Dynamic Insights
        const newInsights: Insight[] = [];

        // 1. Budget Health
        if (totalSpent > totalBudget) {
          newInsights.push({
            id: "budget-alert",
            title: "Over Budget Alert",
            description: `You have exceeded your planned budget by ₹${(totalSpent - totalBudget).toLocaleString()}.`,
            type: "negative",
            value: `Over by ₹${(totalSpent - totalBudget).toLocaleString()}`,
            trend: "up"
          });
        } else if (totalSpent < totalBudget * 0.8) {
          newInsights.push({
            id: "budget-success",
            title: "Under Budget",
            description: "Great job! You are well under your monthly budget limits.",
            type: "positive",
            value: "On Track",
            trend: "down" // spending down is good
          });
        }

        // 2. Subscription Alert
        if (totalSubs > 0) {
          newInsights.push({
            id: "sub-check",
            title: "Subscription Costs",
            description: `You are spending ₹${totalSubs.toLocaleString()} monthly on subscriptions. Check if you use all of them!`,
            type: "tip",
            value: `₹${totalSubs.toLocaleString()}/mo`
          });
        }

        // 3. Savings Rate
        if (savingsRate > 20) {
          newInsights.push({
            id: "savings-high",
            title: "High Savings Rate",
            description: `You are saving ${savingsRate}% of your income. Keep it up!`,
            type: "positive",
            value: `${savingsRate}%`,
            trend: "up"
          });
        } else if (savingsRate < 10 && savingsRate > 0) {
          newInsights.push({
            id: "savings-low",
            title: "Boost Your Savings",
            description: "Try to reduce discretionary spending to increase your savings buffer.",
            type: "warning",
            value: `${savingsRate}%`
          });
        } else if (savingsRate <= 0) {
          newInsights.push({
            id: "savings-negative",
            title: "Negative Cash Flow",
            description: "Your expenses are exceeding your estimated income.",
            type: "negative",
            value: "Critical"
          });
        }

        // 4. General Tip (Static but helpful)
        newInsights.push({
          id: "general-tip",
          title: "Financial Wellness",
          description: "Review your detailed spending in the Budgets tab to find more opportunities to save.",
          type: "tip"
        });

        setInsights(newInsights);

      } catch (error) {
        console.error("Error calculating insights:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const positiveCount = insights.filter((i) => i.type === "positive").length;
  const warningCount = insights.filter((i) => i.type === "warning" || i.type === "negative").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Insights & Analytics</h1>
        <p className="text-muted-foreground">
          AI-generated insights based on your real spending
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-success-soft border border-success/20 p-5">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-success" />
            <div>
              <p className="text-2xl font-bold text-success">{positiveCount}</p>
              <p className="text-sm text-success/80">Positive trends this month</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-warning-soft border border-warning/20 p-5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-warning" />
            <div>
              <p className="text-2xl font-bold text-warning">{warningCount}</p>
              <p className="text-sm text-warning/80">Areas needing attention</p>
            </div>
          </div>
        </div>
      </div>

      {/* Insights Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {insights.map((insight, index) => {
          const config = typeConfig[insight.type];
          const Icon = subtype => config.icon; // Fixed accessing icon mapping

          return (
            // Actually, typeConfig has the component directly
            // Let's just use it cleanly
            <div
              key={insight.id}
              className={cn(
                "rounded-xl bg-card p-5 shadow-card border animate-fade-in",
                config.borderColor
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className={cn("rounded-xl p-3", config.bgColor)}>
                  <config.icon className={cn("h-5 w-5", config.iconColor)} />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-semibold text-foreground">{insight.title}</h3>
                    {insight.trend && (
                      <div
                        className={cn(
                          "flex items-center gap-1 text-sm font-medium",
                          insight.type === "positive" ? "text-success" : "text-danger"
                        )}
                      >
                        {insight.trend === "up" ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                      </div>
                    )}
                    {insight.value && (
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          insight.type === "positive"
                            ? "text-success"
                            : insight.type === "warning"
                              ? "text-warning"
                              : insight.type === "negative"
                                ? "text-danger"
                                : "text-info"
                        )}
                      >
                        {insight.value}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Monthly Summary */}
      <div className="rounded-xl bg-card p-6 shadow-card border border-border/50">
        <h3 className="text-lg font-semibold mb-4">Monthly Summary Overview</h3>
        <p className="text-xs text-muted-foreground mb-4">*Income is estimated based on expenses for demonstration</p>
        <div className="grid gap-6 sm:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground">Est. Income</p>
            <p className="text-xl font-bold text-foreground">₹{summary.income.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="text-xl font-bold text-danger">₹{summary.expenses.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Savings</p>
            <p className="text-xl font-bold text-success">₹{summary.savings.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Savings Rate</p>
            <p className="text-xl font-bold text-primary">{summary.savingsRate}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
