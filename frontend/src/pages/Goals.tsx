import { useState, useEffect } from "react";
import { Plus, Target, Calendar, Sparkles, CheckCircle2, AlertCircle, AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

interface Goal {
  id: string;
  name: string;
  target: number;
  saved: number;
  deadline: string;
  icon: string;
  createdAt?: string;
}


export default function Goals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: "", target: "", deadline: "" });
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const fetchGoals = async () => {
      if (!user) return;

      try {
        const goalsRef = collection(db, "users", user.uid, "goals");
        const q = query(goalsRef, orderBy("createdAt", "desc")); // Assuming you might want to order them
        // If "createdAt" doesn't exist on old docs, this might fail or need composite index if filtered. 
        // For simplicity, let's just fetch all.
        // const q = query(goalsRef); 

        const querySnapshot = await getDocs(goalsRef);
        const fetchedGoals: Goal[] = [];
        querySnapshot.forEach((doc) => {
          fetchedGoals.push({ id: doc.id, ...doc.data() } as Goal);
        });
        setGoals(fetchedGoals);
      } catch (error) {
        console.error("Error fetching goals:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, [user]);

  const handleAddGoal = async () => {
    if (newGoal.name && newGoal.target && newGoal.deadline && user) {
      try {
        const goalData = {
          name: newGoal.name,
          target: parseInt(newGoal.target),
          saved: 0,
          deadline: newGoal.deadline,
          icon: "🎯",
          createdAt: new Date().toISOString(), // Add timestamp for sorting
        };

        const docRef = await addDoc(collection(db, "users", user.uid, "goals"), goalData);

        const newGoalWithId: Goal = {
          id: docRef.id,
          ...goalData,
        };

        setGoals([newGoalWithId, ...goals]); // Add new goal to start of list
        setNewGoal({ name: "", target: "", deadline: "" });
        setIsOpen(false);
      } catch (error) {
        console.error("Error adding goal: ", error);
      }
    }
  };

  const handleDeleteClick = (goalId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setDeleteId(goalId);
  };

  const confirmDelete = async () => {
    if (!user || !deleteId) return;

    try {
      await deleteDoc(doc(db, "users", user.uid, "goals", deleteId));
      setGoals(goals.filter(goal => goal.id !== deleteId));
      setDeleteId(null);
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
  };

  const getStatus = (saved: number, target: number, deadline: string, createdAt?: string) => {
    const progress = (saved / target) * 100;

    // If no createdAt, assume checking against immediate progress or default to On Track if newly created
    // But for a fair comparison, let's look at time elapsed vs total time
    const start = createdAt ? new Date(createdAt).getTime() : new Date().getTime();
    const end = new Date(deadline).getTime();
    const now = new Date().getTime();

    const totalDuration = end - start;
    const elapsed = now - start;

    // If deadline passed or no duration
    if (totalDuration <= 0) return { label: "Behind", color: "warning", icon: AlertCircle };

    const expectedProgress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

    if (progress >= expectedProgress) {
      return { label: "On Track", color: "success", icon: CheckCircle2 };
    }

    if (progress < expectedProgress * 0.8) { // Changed threshold to 80% of expected
      return { label: "At Risk", color: "danger", icon: AlertTriangle };
    }

    return { label: "Behind", color: "warning", icon: AlertCircle };
  };

  const getMonthlyRequired = (target: number, saved: number, deadline: string) => {
    const remaining = target - saved;
    const monthsLeft = Math.max(
      1,
      Math.ceil(
        (new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)
      )
    );
    return Math.ceil(remaining / monthsLeft);
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Goals</h1>
          <p className="text-muted-foreground">
            Track your savings goals and progress
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="goal-name">Goal Name</Label>
                <Input
                  id="goal-name"
                  placeholder="e.g., Dream Vacation"
                  value={newGoal.name}
                  onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target-amount">Target Amount (₹)</Label>
                <Input
                  id="target-amount"
                  type="number"
                  placeholder="100000"
                  value={newGoal.target}
                  onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Target Date</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                />
              </div>
              <Button onClick={handleAddGoal} className="w-full">
                Create Goal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* AI Recommendation */}
      <div className="rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-1 border border-primary/10">
        <div className="rounded-lg bg-card/60 backdrop-blur-sm p-3 flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-1.5 text-primary shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-primary">AI Recommendation:</span> Increasing your monthly contribution to <span className="font-medium text-foreground">Wedding Fund</span> by <span className="font-medium text-foreground">₹3,500</span> would put you back on track for the target date.
            </p>
            <p className="text-xs text-muted-foreground/60 italic">
              If unchanged, this goal may be delayed by 4 months.
            </p>
          </div>
        </div>
      </div>

      {/* Priority Goal Highlight */}
      {(() => {
        if (goals.length === 0) return null;

        const priorityGoal = [...goals].sort((a, b) => {
          const statusA = getStatus(a.saved, a.target, a.deadline, a.createdAt).label;
          const statusB = getStatus(b.saved, b.target, b.deadline, b.createdAt).label;

          if (statusA === "Behind" && statusB !== "Behind") return -1;
          if (statusB === "Behind" && statusA !== "Behind") return 1;

          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        })[0];

        const monthlyAmount = getMonthlyRequired(priorityGoal.target, priorityGoal.saved, priorityGoal.deadline);

        return (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <span className="text-xl">🎯</span>
              <p className="text-sm text-foreground">
                <span className="font-semibold text-primary">Priority Goal:</span> {priorityGoal.name} requires <span className="font-bold text-primary">₹{monthlyAmount.toLocaleString()}/month</span> to stay on track.
              </p>
            </div>
            <div className="hidden sm:block">
              <span className="text-[10px] font-medium uppercase tracking-wider text-primary/60 bg-primary/10 px-2 py-0.5 rounded-full">
                Most Urgent
              </span>
            </div>
          </div>
        );
      })()}

      {/* Goals Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {[...goals]
          .sort((a, b) => {
            const statusA = getStatus(a.saved, a.target, a.deadline, a.createdAt).label;
            const statusB = getStatus(b.saved, b.target, b.deadline, b.createdAt).label;

            if (statusA === "Behind" && statusB !== "Behind") return -1;
            if (statusB === "Behind" && statusA !== "Behind") return 1;

            return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
          })
          .map((goal, index) => {
            const progress = (goal.saved / goal.target) * 100;
            const status = getStatus(goal.saved, goal.target, goal.deadline, goal.createdAt);
            const monthlyRequired = getMonthlyRequired(goal.target, goal.saved, goal.deadline);
            const daysRemaining = Math.ceil(
              (new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );

            return (
              <div
                key={goal.id}
                className="rounded-xl bg-card p-6 shadow-card border border-border/50 animate-fade-in group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{goal.icon}</span>
                    <div>
                      <h3 className="font-semibold text-foreground">{goal.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(goal.deadline).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        <span className="mx-1 text-muted-foreground/30">•</span>
                        {daysRemaining < 0 ? (
                          <span className="text-danger font-medium">⚠️ Behind schedule by {Math.abs(daysRemaining)} days</span>
                        ) : (
                          <span className="text-success font-medium">⏳ {daysRemaining} days left</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border border-transparent transition-colors",
                        status.color === "success" && "bg-success-soft text-success",
                        status.color === "warning" && "bg-warning-soft text-warning",
                        status.color === "danger" && "bg-danger-soft text-danger"
                      )}
                    >
                      <status.icon className="h-3 w-3" />
                      {status.label}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleDeleteClick(goal.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>



                {/* Progress */}
                <div className="space-y-3 relative">
                  <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-3 rounded-full bg-primary transition-all duration-700"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm transition-opacity duration-300 group-hover:opacity-20">
                    <span className="text-muted-foreground">
                      ₹{goal.saved.toLocaleString()} saved
                    </span>
                    <span className="font-medium">{progress.toFixed(0)}%</span>
                  </div>
                  {/* Micro-interaction: Remaining amount reveal on hover */}
                  <div className="absolute inset-x-0 bottom-0 flex justify-center translate-y-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <span className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full shadow-lg border border-primary-foreground/20">
                      ₹{(goal.target - goal.saved).toLocaleString()} to go
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Target</p>
                    <p className="font-semibold">₹{goal.target.toLocaleString()}</p>
                  </div>
                  <div className={cn(
                    "rounded-lg p-3 transition-colors border border-transparent",
                    status.color === "danger" && "bg-danger/10 border-danger/20",
                    status.color === "success" && "bg-success/10 border-success/20",
                    status.color === "warning" && "bg-muted/50"
                  )}>
                    <p className="text-xs text-muted-foreground">Monthly Required</p>
                    <p className={cn(
                      "transition-all",
                      status.color === "danger" ? "font-bold text-danger text-lg" :
                        status.color === "success" ? "text-success font-semibold" :
                          "font-semibold text-primary"
                    )}>
                      ₹{monthlyRequired.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Empty State */}
      {goals.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <Target className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No goals yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first savings goal to start tracking
          </p>
          <Button onClick={() => setIsOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Goal
          </Button>
        </div>
      )}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your goal.
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
