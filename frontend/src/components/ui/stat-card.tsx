import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "danger" | "warning";
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: StatCardProps) {
  return (
    <div
      tabIndex={0}
      className={cn(
        "group relative overflow-hidden rounded-2xl border p-6 transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        "bg-gradient-to-br from-card to-card/50 backdrop-blur-sm",
        "border-2 border-border hover:border-primary/40",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative z-10 flex items-start justify-between">
        <div className="space-y-4">
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-muted-foreground tracking-wide">
              {title}
            </p>
            <p className="text-3xl font-bold tracking-tight text-foreground">
              {value}
            </p>
          </div>

          {(subtitle || trend) && (
            <div className="flex items-center gap-2 text-sm">
              {trend && (
                <div
                  className={cn(
                    "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border",
                    trend.isPositive
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                  )}
                >
                  <span>{trend.isPositive ? "↗" : "↘"}</span>
                  <span>{Math.abs(trend.value)}%</span>
                </div>
              )}
              {subtitle && (
                <p className="text-xs text-muted-foreground/80">
                  {subtitle}
                </p>
              )}
            </div>
          )}
        </div>

        <div
          className={cn(
            "rounded-xl p-3 transition-colors duration-300",
            "bg-gradient-to-br shadow-inner border border-white/10",
            variant === "default" &&
            "from-primary/20 to-primary/5 text-primary",
            variant === "success" &&
            "from-emerald-500/20 to-emerald-500/5 text-emerald-600",
            variant === "danger" &&
            "from-rose-500/20 to-rose-500/5 text-rose-600",
            variant === "warning" &&
            "from-amber-500/20 to-amber-500/5 text-amber-600"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
