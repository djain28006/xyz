import { useState, useEffect } from "react";
import { TrendingUp, Clock, Shield, Info, Plus } from "lucide-react";
import { RiskBadge, RiskLevel } from "@/components/ui/risk-badge";
import { Button } from "@/components/ui/button";

interface Investment {
  id: number;
  name: string;
  type: string;
  expectedReturns: string;
  risk: RiskLevel;
  timeHorizon: string;
  minInvestment: number;
  description: string;
}


export default function Investments() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/dashboard/investments")
      .then(res => res.json())
      .then(data => {
        if (data.investments) {
          setInvestments(data.investments);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Investment Recommendations</h1>
        <p className="text-muted-foreground">
          AI-curated investment options based on your risk profile
        </p>
      </div>

      {/* Risk Profile Card */}
      <div className="rounded-xl bg-card p-6 shadow-card border border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Your Risk Profile</h3>
              <p className="text-sm text-muted-foreground">
                Based on your age, income, and goals
              </p>
            </div>
          </div>
          <RiskBadge level="medium" />
        </div>
        <div className="mt-4 p-4 rounded-lg bg-muted/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Portfolio Allocation</span>
            <div className="flex items-center gap-3 text-xs font-medium">
              <span className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-primary" /> Equity: 60%</span>
              <span className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-muted-foreground/40" /> Debt: 40%</span>
            </div>
          </div>
          <div className="h-1.5 w-full flex rounded-full overflow-hidden bg-muted-foreground/10 mb-4">
            <div className="h-full bg-primary" style={{ width: "60%" }} />
            <div className="h-full bg-muted-foreground/30" style={{ width: "40%" }} />
          </div>
          <p className="text-sm text-muted-foreground">
            <Info className="inline-block h-4 w-4 mr-1 -mt-0.5" />
            A moderate risk profile suggests a balanced portfolio with 60% equity and 40%
            debt instruments for optimal growth with managed volatility.
          </p>
        </div>
      </div>

      {/* Top Pick for You */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <TrendingUp className="h-4 w-4" />
        </div>
        <p className="text-sm text-foreground">
          <span className="font-semibold text-primary">⭐ Top Pick:</span> <span className="font-medium">Nifty 50 Index Fund</span> — ideal for medium risk, long-term growth.
        </p>
      </div>

      {/* Comparison Section */}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <div className="bg-muted/30 px-4 py-2 border-b border-border/50">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick Comparison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/50 text-muted-foreground">
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium text-center">Returns</th>
                <th className="px-4 py-3 font-medium text-center">Risk</th>
                <th className="px-4 py-3 font-medium text-center">Liquidity</th>
                <th className="px-4 py-3 font-medium">Best For</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              <tr>
                <td className="px-4 py-3 font-medium">Fixed Deposit</td>
                <td className="px-4 py-3 text-center">~6.5%</td>
                <td className="px-4 py-3 text-center text-success">Low</td>
                <td className="px-4 py-3 text-center">Locked</td>
                <td className="px-4 py-3 text-muted-foreground">Safety & Stability</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium">Mutual Funds</td>
                <td className="px-4 py-3 text-center">~12%</td>
                <td className="px-4 py-3 text-center text-warning">Medium</td>
                <td className="px-4 py-3 text-center">Moderate</td>
                <td className="px-4 py-3 text-muted-foreground">Balanced Growth</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium">Stocks</td>
                <td className="px-4 py-3 text-center">Variable</td>
                <td className="px-4 py-3 text-center text-danger">High</td>
                <td className="px-4 py-3 text-center text-success">High</td>
                <td className="px-4 py-3 text-muted-foreground">Long-term Wealth</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground/60 italic flex items-center gap-1.5 px-1 -mt-2">
        <span>🤖</span>
        Based on your medium-risk profile and 5+ year goals, Mutual Funds provide the most balanced risk–return tradeoff.
      </p>

      {/* Risk vs Return Visual */}
      <div className="rounded-xl border border-border/50 bg-card p-6 shadow-card">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-sm font-semibold text-foreground">Risk vs Potential Return</h3>
          <div className="flex items-center gap-4 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
            <span className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-success" /> Low</span>
            <span className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-primary" /> Medium</span>
            <span className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-danger" /> High</span>
          </div>
        </div>

        <div className="relative h-48 w-full border-l-2 border-b-2 border-border/40 ml-4">
          {/* Y Axis - Return */}
          <div className="absolute -left-10 top-0 h-full flex items-center justify-center">
            <span className="text-[9px] font-bold text-muted-foreground/40 float-left -rotate-90 uppercase tracking-[0.2em]">Return</span>
          </div>

          {/* X Axis - Risk */}
          <div className="absolute -bottom-6 left-0 w-full flex justify-center">
            <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">Risk Exposure</span>
          </div>

          {/* Grid Lines (Subtle) */}
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
            <div className="border-r border-b border-border/10" />
            <div className="border-b border-border/10" />
            <div className="border-r border-border/10" />
            <div className="border-border/10" />
          </div>

          {/* Fixed Deposits (Low/Low) */}
          <div className="absolute bottom-[20%] left-[15%] group cursor-help">
            <div className="h-3 w-3 rounded-full bg-success shadow-[0_0_12px_rgba(34,197,94,0.4)] transition-transform group-hover:scale-125" />
            <span className="absolute left-6 -translate-y-1/2 top-1.5 text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors whitespace-nowrap">
              Fixed Deposits
            </span>
          </div>

          {/* Mutual Funds (Medium/Medium) */}
          <div className="absolute bottom-[55%] left-[50%] group cursor-help z-10">
            <div className="h-5 w-5 rounded-full bg-primary border-4 border-background shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-transform group-hover:scale-110" />
            <div className="absolute left-8 -translate-y-1/2 top-1/2">
              <span className="text-xs font-bold text-primary whitespace-nowrap">Recommended</span>
              <p className="text-[10px] text-muted-foreground whitespace-nowrap">Mutual Funds</p>
            </div>
          </div>

          {/* Stocks (High/High) */}
          <div className="absolute bottom-[85%] left-[85%] group cursor-help">
            <div className="h-3 w-3 rounded-full bg-danger shadow-[0_0_12px_rgba(239,68,68,0.4)] transition-transform group-hover:scale-125" />
            <span className="absolute right-6 -translate-y-1/2 top-1.5 text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors whitespace-nowrap">
              Stocks
            </span>
          </div>
        </div>
      </div>

      {/* Investment Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...investments]
          .sort((a, b) => {
            const riskOrder: Record<string, number> = { medium: 0, low: 1, high: 2 };
            return riskOrder[a.risk] - riskOrder[b.risk];
          })
          .map((investment, index) => (
            <div
              key={investment.id}
              className="rounded-xl bg-card p-6 shadow-card border border-border/50 hover:shadow-soft transition-shadow animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Header */}
              <div className="mb-4">
                <div className="flex items-start justify-between mb-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {investment.type}
                  </span>
                  <RiskBadge level={investment.risk} />
                </div>
                <h3 className="font-semibold text-foreground">{investment.name}</h3>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {investment.description}
              </p>

              {/* Stats */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4 text-success" />
                    Expected Returns
                  </div>
                  <span className="font-semibold text-success">
                    {investment.expectedReturns}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground/70 -mt-1 mb-1">
                  {investment.risk === "medium"
                    ? `Matches your medium-risk appetite and ${investment.timeHorizon} horizon.`
                    : investment.risk === "low"
                      ? "Conservative option to lower your overall portfolio risk."
                      : "Aggressive growth potential to complement your portfolio."}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Time Horizon
                  </div>
                  <span className="font-medium">{investment.timeHorizon}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Min. Investment</span>
                  <span className="font-medium">₹{investment.minInvestment.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  variant="outline"
                  className="w-full h-9 text-xs font-semibold hover:bg-primary/5 hover:text-primary transition-colors border-primary/20"
                >
                  {investment.type === "SIP" || investment.type === "Mutual Fund"
                    ? "Start SIP"
                    : "Add to Portfolio"}
                </Button>
              </div>
            </div>
          ))}
      </div>

      {/* Disclaimer */}
      <div className="rounded-xl bg-muted/50 p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Disclaimer:</strong> These recommendations are for informational purposes
          only and do not constitute financial advice. Past performance is not indicative
          of future results. Please consult a certified financial advisor before making
          investment decisions.
        </p>
      </div>
    </div>
  );
}
