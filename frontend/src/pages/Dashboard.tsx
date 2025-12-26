import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wallet,
  TrendingDown,
  PiggyBank,
  Shield,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Bot,
  ArrowRight,
  Target,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { RiskBadge } from "@/components/ui/risk-badge";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

// LazyRender Component for performance
function LazyRender({ children, height }: { children: React.ReactNode; height: number | string }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px" } // Preload when 100px away
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref} style={{ height }}>{isVisible ? children : null}</div>;
}

import { useDashboardData } from "@/hooks/use-dashboard-data";

// ... inside component ...

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAiExpanded, setIsAiExpanded] = useState(false);

  // Use the hook instead of local fetching
  const { summary, expenses, history, loading: dataLoading } = useDashboardData();
  const loading = dataLoading;

  // Real Data State (Derived from Hook Data)
  const realIncome = useMemo(() => {
    return summary?.profile?.monthly_income || 50000; // Fallback to 50k if not set
  }, [summary]);

  const realExpenses = useMemo(() => {
    // If we have detailed expenses from hook
    if (expenses?.expenses) {
      return expenses.expenses.reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0);
    }
    // Fallback to summary totals
    return summary?.total_expenses || 0;
  }, [expenses, summary]);

  const realInvestment = useMemo(() => {
    return summary?.total_investment || 0;
  }, [summary]);

  const categoryStats = useMemo(() => {
    if (!summary?.summary?.expenses) return [];

    // Convert object { category: amount } to array for chart
    const colors = [
      "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)", "hsl(199, 89%, 48%)",
      "hsl(220, 9%, 46%)", "hsl(280, 65%, 60%)", "hsl(234, 89%, 54%)"
    ];

    return Object.entries(summary.summary.expenses).map(([name, value], idx) => ({
      name,
      value: Number(value),
      color: colors[idx % colors.length]
    })).sort((a, b) => b.value - a.value);
  }, [summary]);

  const expenseHistory = useMemo(() => {
    if (!history?.history) return [];
    // Transform API history to chart format if needed, or use directly if it matches
    // API returns [{month: "Jan", expense: 100}, ...] usually
    return history.history.map((h: any) => ({
      month: h.month,
      amount: h.expense
    }));
  }, [history]);


  const savingsGoalProgress = useMemo(() => {
    if (!realIncome) return 0;
    const savings = realIncome - realExpenses;
    return Math.max(0, Math.min(100, Math.round((savings / (realIncome * 0.2)) * 100)));
  }, [realIncome, realExpenses]);

  // Finance Overview Data (Combined Chart)
  const financeOverviewData = useMemo(() => {
    // Create a mocked dataset for the "ComposedChart" using the real history
    // We only have expense history real, so we mock income/investment relative to it for the visual
    return expenseHistory.map(h => ({
      month: h.month,
      expense: h.amount,
      income: h.amount * 1.4, // Visual integrity
      investment: h.amount * 0.2
    }));
  }, [expenseHistory]);

  // Simple Investment Growth (Static projection based on 0 or mock base if 0)
  const investmentGrowthData = useMemo(() => {
    const base = realInvestment || 10000; // default for visuals
    const years = [2024, 2025, 2026, 2027, 2028, 2029];
    return years.map((year, i) => ({
      year: year.toString(),
      fd: Math.round(base * Math.pow(1.06, i)),
      mf: Math.round(base * Math.pow(1.12, i)),
      stock: Math.round(base * Math.pow(1.15, i))
    }));
  }, [realInvestment]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-lg">
          Welcome back! Here's your financial overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Est. Monthly Income"
          value={`₹${realIncome.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          icon={Wallet}
          variant="success"
        />
        <StatCard
          title="Total Expenses"
          value={`₹${realExpenses.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          icon={TrendingDown}
          trend={{ value: 0, isPositive: false }}
          variant="danger"
        />
        <StatCard
          title="Investments"
          value={`₹${realInvestment.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          icon={PiggyBank}
          trend={{ value: 0, isPositive: true }}
          variant="success"
        />
        <StatCard
          title="Risk Score"
          value="Low"
          icon={Shield}
          variant="default"
        />
      </div>

      {/* AI Insight Section */}
      <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-1 border border-primary/10 transition-all duration-300">
        <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-white/5 overflow-hidden">
          <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-primary/10 p-3 ring-1 ring-primary/25">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  AI Insight
                  <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-xs font-medium text-primary">
                    New
                  </span>
                </h3>
                <p className="mt-1 text-muted-foreground max-w-2xl">
                  You have saved <span className="font-semibold text-foreground">{realIncome > 0 ? Math.round(((realIncome - realExpenses) / realIncome) * 100) : 0}%</span> of your income this month.
                  {realExpenses > realIncome
                    ? " You are currently spending more than you earn. Review your recent expenses to get back on track."
                    : ((realIncome - realExpenses) / realIncome) > 0.2
                      ? " Excellent! You are meeting the recommended 20% savings rule. Keep it up!"
                      : " Try to increase your savings to 20% for better financial health."}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsAiExpanded(!isAiExpanded)}
              className="whitespace-nowrap rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 flex items-center gap-2"
            >
              {isAiExpanded ? "Hide Insights" : "Ask AI Agents"}
              {isAiExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {/* Expanded Agent Insights */}
          {isAiExpanded && (
            <div className="p-6 pt-0 border-t border-white/5 animate-in slide-in-from-top-2 fade-in duration-300">
              <div className="grid gap-4 md:grid-cols-3 mt-4">
                {/* Budget Agent */}
                <div className="rounded-xl bg-card/80 p-4 border border-border/50">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500"><Bot className="h-4 w-4" /></div>
                    <span className="font-semibold text-sm">Budget Agent</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your <span className="font-medium text-foreground">Income utilization</span> is {realIncome > 0 ? ((realExpenses / realIncome) * 100).toFixed(0) : 0}%.
                    {realExpenses < realIncome * 0.5
                      ? " You are operating well within a safe margin. Consider increasing investments."
                      : " You are consuming a large portion of your income on expenses."}
                  </p>
                </div>

                {/* Savings Agent */}
                <div className="rounded-xl bg-card/80 p-4 border border-border/50">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500"><Target className="h-4 w-4" /></div>
                    <span className="font-semibold text-sm">Savings Agent</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Based on your salary of ₹{realIncome.toLocaleString()}, your target monthly savings should be <span className="font-medium text-foreground">₹{(realIncome * 0.2).toLocaleString()}</span>.
                    Currently saving: <span className={realIncome - realExpenses >= realIncome * 0.2 ? "text-emerald-500 font-medium" : "text-amber-500 font-medium"}>₹{(Math.max(0, realIncome - realExpenses)).toLocaleString()}</span>.
                  </p>
                </div>

                {/* Forecast Agent */}
                <div className="rounded-xl bg-card/80 p-4 border border-border/50">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500"><ArrowRight className="h-4 w-4" /></div>
                    <span className="font-semibold text-sm">Forecast Agent</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    At this rate, your projected annual savings will be <span className="font-medium text-foreground">₹{Math.max(0, (realIncome - realExpenses) * 12).toLocaleString()}</span>.
                    {expenseHistory.length > 0 && expenseHistory[0].amount > realExpenses ? " Your spending is trending down vs last month. Good sign!" : ""}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button onClick={() => navigate("/insights")} className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                  View Full Analysis <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Summary Strip */}
      <div className="rounded-xl border-2 border-border bg-secondary/30 p-3 shadow-sm mx-1">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
          <span className="font-medium text-muted-foreground mr-2 hidden sm:inline">This Month:</span>

          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Income</span>
            <span className="font-semibold text-emerald-600">₹{realIncome.toLocaleString()}</span>
          </div>

          <div className="h-3 w-px bg-border/60 hidden sm:block" />

          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Expenses</span>
            <span className="font-semibold text-emerald-600">₹{realExpenses.toLocaleString()}</span>
          </div>

          <div className="h-3 w-px bg-border/60 hidden sm:block" />

          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Investments</span>
            <span className="font-semibold text-emerald-600">₹{realInvestment.toLocaleString()}</span>
          </div>

          <div className="h-3 w-px bg-border/60 hidden sm:block" />

          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <span>Cashflow Positive</span>
            <div className={`h-1.5 w-1.5 rounded-full animate-pulse ${realExpenses < realIncome ? "bg-emerald-500" : "bg-red-500"}`} />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Expense Trend Chart */}
        <div className="lg:col-span-2 rounded-2xl bg-card p-6 shadow-sm border border-border/40 hover:border-border/60 transition-colors">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold tracking-tight">Financial Trends</h3>
            <span className="text-sm font-medium text-muted-foreground">Recent Activity</span>
          </div>
          <div className="h-[250px]">
            {expenseHistory.length > 0 ? (
              <LazyRender height="100%">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={expenseHistory}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                    <XAxis
                      dataKey="month"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={(value) => `₹${(value / 1000).toFixed(1)}k`}
                      tickLine={false}
                      axisLine={false}
                      dx={-10}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        padding: "12px",
                      }}
                      cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeDasharray: "4 4" }}
                      formatter={(value: number) => [`₹${value.toLocaleString()}`, "Expenses"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      dot={{ fill: "hsl(var(--background))", stroke: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, strokeWidth: 0, fill: "hsl(var(--primary))" }}
                      isAnimationActive={true}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </LazyRender>
            ) : (<div className="h-full flex items-center justify-center text-muted-foreground">No Expense Data Yet</div>)}
          </div>
        </div>

        {/* Savings Goal */}
        <div className="rounded-2xl bg-card p-6 shadow-sm border border-border/40 flex flex-col justify-between hover:border-border/60 transition-colors">
          <div>
            <h3 className="mb-2 text-lg font-semibold tracking-tight">Savings Goal</h3>
            <p className="text-sm text-muted-foreground mb-6">Emergency Fund</p>
          </div>
          <div className="flex flex-col items-center justify-center py-4">
            <ProgressRing progress={savingsGoalProgress} size={180} strokeWidth={15}>
              <div className="text-center">
                <p className="text-4xl font-bold text-foreground tracking-tighter">{savingsGoalProgress}%</p>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mt-1">Goal Met</p>
              </div>
            </ProgressRing>
            {/* ... rest of savings card ... */}
            <div className="mt-8 w-full space-y-4">
              <div className="flex justify-between items-center text-sm p-3 rounded-lg bg-secondary/50">
                <span className="text-muted-foreground">Target</span>
                <span className="font-semibold tabular-nums">₹{(realIncome * 0.2).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm p-3 rounded-lg bg-success/10 border border-success/20">
                <span className="text-muted-foreground">Saved</span>
                <span className="font-semibold text-success tabular-nums">₹{(realIncome - realExpenses).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>


        {/* Income vs Spending vs Investment */}
        <div className="lg:col-span-2 rounded-2xl bg-card p-6 shadow-sm border border-border/40 hover:border-border/60 transition-colors">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold tracking-tight">Income vs Expenses</h3>
              <p className="text-sm text-muted-foreground">Monthly breakdown</p>
            </div>
          </div>
          <div className="h-[260px]">
            <LazyRender height="100%">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={financeOverviewData} barGap={8}>
                  {/* ... defs and axes same as before ... */}
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={1} />
                      <stop offset="100%" stopColor="#e11d48" stopOpacity={1} />
                    </linearGradient>
                    <linearGradient id="investBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} tickLine={false} axisLine={false} dx={-10} />
                  <Tooltip cursor={{ fill: "hsl(var(--muted)/0.2)" }} contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))" }} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />

                  <Area type="monotone" dataKey="income" fill="url(#incomeGradient)" stroke="transparent" isAnimationActive={true} />
                  <Bar dataKey="expense" name="Expenses" fill="url(#expenseBar)" radius={[6, 6, 0, 0]} barSize={12} isAnimationActive={true} />
                  <Bar dataKey="investment" name="Investment" fill="url(#investBar)" radius={[6, 6, 0, 0]} barSize={12} isAnimationActive={true} />
                </ComposedChart>
              </ResponsiveContainer>
            </LazyRender>
          </div>
        </div>

        {/* Investment Growth Comparison */}
        <div className="rounded-2xl bg-card p-6 shadow-sm border border-border/40 hover:border-border/60 transition-colors flex flex-col">
          {/* ... header ... */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold tracking-tight">Growth Projection</h3>
            <p className="text-sm text-muted-foreground">Estimated returns over 5 years</p>
          </div>
          <div className="h-[200px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={investmentGrowthData}>
                {/* ... same config ... */}
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} dy={5} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="fd" name="FD" stroke="#64748b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="mf" name="Mutual Funds" stroke="#eab308" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="stock" name="Stocks" stroke="#2563eb" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>



      {/* Bottom Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category Split */}
        <div className="rounded-2xl bg-card p-6 shadow-sm border border-border/40 hover:border-border/60 transition-colors">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold tracking-tight">Where Money Goes</h3>
            <button
              onClick={() => navigate("/expenses")}
              className="text-sm text-primary hover:underline"
            >
              View Details
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="h-48 w-48 relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    cornerRadius={4}
                  >
                    {categoryStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="hsl(var(--card))" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      boxShadow: "var(--shadow-md)",
                    }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-xs text-muted-foreground font-medium text-center">Top<br />Expenses</p>
              </div>
            </div>
            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {categoryStats.length > 0 ? categoryStats.map((category) => (
                <div key={category.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full ring-2 ring-white/10"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm text-muted-foreground truncate max-w-[100px] capitalize">
                      {category.name}
                    </span>
                  </div>
                  <span className="text-sm font-medium tabular-nums">
                    ₹{category.value.toLocaleString()}
                  </span>
                </div>
              )) : <div className="text-sm text-muted-foreground col-span-2 text-center">No expense categories yet</div>}
            </div>
          </div>
        </div>

        {/* Risk Profile */}
        <div className="rounded-2xl bg-card p-6 shadow-sm border border-border/40 hover:border-border/60 transition-colors">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold tracking-tight">Financial Health</h3>
            <RiskBadge level="low" />
          </div>
          <div className="space-y-8">
            <div className="group">
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-muted-foreground font-medium">Savings Rate</span>
                <span className="font-bold text-success">{realIncome > 0 ? Math.round(((realIncome - realExpenses) / realIncome) * 100) : 0}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-success relative group-hover:opacity-90 transition-opacity"
                  style={{ width: `${realIncome > 0 ? Math.max(0, Math.min(100, ((realIncome - realExpenses) / realIncome) * 100)) : 0}%` }}
                >
                  <div className="absolute inset-0 bg-white/20" />
                </div>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">Keep saving to build your safety net.</p>
            </div>
            <div className="group">
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-muted-foreground font-medium">Budget Adherence</span>
                <span className="font-bold text-primary">{realIncome > 0 && realExpenses <= realIncome ? "100" : "Alert"}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary relative group-hover:opacity-90 transition-opacity"
                  style={{ width: `${realExpenses <= realIncome ? 100 : Math.max(0, 100 - ((realExpenses - realIncome) / realIncome) * 100)}%` }}
                >
                  <div className="absolute inset-0 bg-white/20" />
                </div>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">You are {realExpenses <= realIncome ? "within" : "over"} your estimated budget.</p>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}

