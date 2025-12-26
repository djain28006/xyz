import { useState, useEffect } from "react";
import { AlertTriangle, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";

interface BudgetCategory {
  id: string;
  name: string;
  budget: number;
  spent: number;
  icon: string;
}


export default function Budgets() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<BudgetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [newBudget, setNewBudget] = useState({ name: "", budget: "", spent: "0" });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const fetchBudgets = async () => {
      if (!user) return;

      try {
        const budgetsRef = collection(db, "users", user.uid, "budgets");
        // const q = query(budgetsRef, orderBy("createdAt", "desc")); 
        const querySnapshot = await getDocs(budgetsRef);
        const fetchedBudgets: BudgetCategory[] = [];
        querySnapshot.forEach((doc) => {
          fetchedBudgets.push({ id: doc.id, ...doc.data() } as BudgetCategory);
        });
        setBudgets(fetchedBudgets);
      } catch (error) {
        console.error("Error fetching budgets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBudgets();
  }, [user]);

  const handleAddBudget = async () => {
    if (newBudget.name && newBudget.budget && user) {
      try {
        const budgetData = {
          name: newBudget.name,
          budget: parseInt(newBudget.budget),
          spent: parseInt(newBudget.spent) || 0,
          icon: "💰", // Default icon
          createdAt: new Date().toISOString(),
        };

        const docRef = await addDoc(collection(db, "users", user.uid, "budgets"), budgetData);

        const newBudgetWithId: BudgetCategory = {
          id: docRef.id,
          ...budgetData,
        };

        setBudgets([...budgets, newBudgetWithId]);
        setNewBudget({ name: "", budget: "", spent: "0" });
        setIsOpen(false);
      } catch (error) {
        console.error("Error adding budget: ", error);
      }
    }
  };

  const handleDeleteClick = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!user || !deleteId) return;

    try {
      await deleteDoc(doc(db, "users", user.uid, "budgets", deleteId));
      setBudgets(budgets.filter(b => b.id !== deleteId));
      setDeleteId(null);
    } catch (error) {
      console.error("Error deleting budget:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Budgets</h1>
          <p className="text-muted-foreground">
            Manage your category-wise spending limits
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Budget
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Budget</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Food, Travel"
                  value={newBudget.name}
                  onChange={(e) => setNewBudget({ ...newBudget, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">Budget Limit (₹)</Label>
                <Input
                  id="budget"
                  type="number"
                  placeholder="5000"
                  value={newBudget.budget}
                  onChange={(e) => setNewBudget({ ...newBudget, budget: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="spent">Current Spent (₹) <span className="text-xs text-muted-foreground">(Optional start value)</span></Label>
                <Input
                  id="spent"
                  type="number"
                  placeholder="0"
                  value={newBudget.spent}
                  onChange={(e) => setNewBudget({ ...newBudget, spent: e.target.value })}
                />
              </div>
              <Button onClick={handleAddBudget} className="w-full">
                Create Budget
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Priority Alert */}
      {(() => {
        const criticalBudget = [...budgets]
          .sort((a, b) => (b.spent - b.budget) - (a.spent - a.budget))
          .find(b => b.spent > b.budget);

        if (criticalBudget) {
          const overAmount = criticalBudget.spent - criticalBudget.budget;
          return (
            <div className="rounded-xl border border-danger/20 bg-danger/5 p-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="rounded-full bg-danger/10 p-1.5 text-danger shrink-0">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <p className="text-sm text-foreground">
                <span className="font-semibold text-danger">Priority Alert:</span> {criticalBudget.name} has exceeded its budget by <span className="font-bold">₹{overAmount.toLocaleString()}</span>.
              </p>
            </div>
          );
        }
        return null;
      })()}

      {/* AI Hint */}
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
        <p className="text-sm text-primary">
          💡 <strong>AI Tip:</strong> Your budgets are automatically adjusted
          based on your spending patterns. We recommend increasing your Food
          budget by ₹2,000.
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-card p-6 shadow-card border-2 border-border">
          <p className="text-sm text-muted-foreground">Total Budget</p>
          <p className="text-2xl font-bold">
            ₹{budgets.reduce((sum, b) => sum + b.budget, 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl bg-card p-6 shadow-card border-2 border-border">
          <p className="text-sm text-muted-foreground">Total Spent</p>
          <p className="text-2xl font-bold text-danger">
            ₹{budgets.reduce((sum, b) => sum + b.spent, 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl bg-card p-6 shadow-card border-2 border-border">
          <p className="text-sm text-muted-foreground">Overall Status</p>
          <p className="text-2xl font-bold text-warning">
            {budgets.filter((b) => b.spent > b.budget).length} over budget
          </p>
        </div>
      </div>

      {/* Budget Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...budgets]
          .sort((a, b) => (b.spent / b.budget) - (a.spent / a.budget))
          .map((budget, index) => {
            const percentage = (budget.spent / budget.budget) * 100;
            const isOverBudget = percentage > 100;
            const isNearLimit = percentage >= 80 && percentage <= 100;
            const remaining = budget.budget - budget.spent;

            let statusConfig = { label: "Safe", color: "bg-emerald-500/10 text-emerald-500" };
            if (isOverBudget) statusConfig = { label: "Over Budget", color: "bg-red-500/10 text-red-500" };
            else if (isNearLimit) statusConfig = { label: "Near Limit", color: "bg-amber-500/10 text-amber-500" };

            return (
              <div
                key={budget.id}
                className={cn(
                  "rounded-xl bg-card p-6 shadow-card border transition-all animate-fade-in group",
                  isOverBudget ? "border-danger/50" : "border-border/50"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{budget.icon}</span>
                    <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-2">
                      <h3 className="font-semibold text-foreground">{budget.name}</h3>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium border border-transparent", statusConfig.color)}>
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={(e) => handleDeleteClick(budget.id, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-3 rounded-full transition-all duration-700",
                        isOverBudget ? "bg-danger" : percentage > 80 ? "bg-warning" : "bg-success"
                      )}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      ₹{budget.spent.toLocaleString()} spent
                    </span>
                    <span
                      className={cn(
                        "font-medium",
                        isOverBudget ? "text-danger" : "text-muted-foreground"
                      )}
                    >
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-4 flex justify-between text-sm">
                  <div>
                    <p className="text-muted-foreground">Budget</p>
                    <p className="font-semibold">₹{budget.budget.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground">
                      {isOverBudget ? "Over by" : "Remaining"}
                    </p>
                    <p
                      className={cn(
                        "font-semibold",
                        isOverBudget ? "text-danger" : "text-success"
                      )}
                    >
                      ₹{Math.abs(remaining).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your budget.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
