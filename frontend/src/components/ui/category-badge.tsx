import { cn } from "@/lib/utils";

type CategoryType =
  | "food"
  | "travel"
  | "emi"
  | "utilities"
  | "entertainment"
  | "shopping"
  | "health"
  | "other";

const categoryStyles: Record<CategoryType, string> = {
  food: "bg-warning-soft text-warning",
  travel: "bg-info-soft text-info",
  emi: "bg-danger-soft text-danger",
  utilities: "bg-muted text-muted-foreground",
  entertainment: "bg-chart-5/10 text-chart-5",
  shopping: "bg-primary/10 text-primary",
  health: "bg-success-soft text-success",
  other: "bg-secondary text-secondary-foreground",
};

interface CategoryBadgeProps {
  category: CategoryType;
  className?: string;
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize",
        categoryStyles[category],
        className
      )}
    >
      {category}
    </span>
  );
}

export type { CategoryType };
