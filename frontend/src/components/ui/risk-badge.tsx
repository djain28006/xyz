import { cn } from "@/lib/utils";

type RiskLevel = "low" | "medium" | "high";

const riskStyles: Record<RiskLevel, string> = {
  low: "bg-success-soft text-success border-success/20",
  medium: "bg-warning-soft text-warning border-warning/20",
  high: "bg-danger-soft text-danger border-danger/20",
};

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
}

export function RiskBadge({ level, className }: RiskBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border",
        riskStyles[level],
        className
      )}
    >
      {level} Risk
    </span>
  );
}

export type { RiskLevel };
