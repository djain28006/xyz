import { useState, useEffect } from "react";
import { AlertCircle, Calendar, IndianRupee, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";

interface Subscription {
  id: string;
  name: string;
  cost: number;
  nextRenewal: string;
  category: string;
  logo: string;
  isActive: boolean;
  recommendation?: "keep" | "cancel";
}

export default function Subscriptions() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [newSub, setNewSub] = useState({ name: "", cost: "", nextRenewal: "" });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      if (!user) return;

      try {
        const subRef = collection(db, "users", user.uid, "subscriptions");
        const querySnapshot = await getDocs(subRef);
        const fetchedSubs: Subscription[] = [];
        querySnapshot.forEach((doc) => {
          fetchedSubs.push({ id: doc.id, ...doc.data() } as Subscription);
        });
        setSubscriptions(fetchedSubs);
      } catch (error) {
        console.error("Error fetching subscriptions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, [user]);

  const handleAddSubscription = async () => {
    console.log("Adding subscription...", newSub, user);
    if (newSub.name && newSub.cost && newSub.nextRenewal && user) {
      try {
        const subData = {
          name: newSub.name,
          cost: parseInt(newSub.cost),
          nextRenewal: newSub.nextRenewal,
          category: "Other", // Default for now
          logo: "💳",
          isActive: true,
          recommendation: "keep",
          createdAt: new Date().toISOString(),
        };

        console.log("Writing to Firestore...", subData);
        const docRef = await addDoc(collection(db, "users", user.uid, "subscriptions"), subData);
        console.log("Document written with ID: ", docRef.id);

        const newSubWithId: Subscription = {
          id: docRef.id,
          ...subData,
        } as Subscription;

        setSubscriptions([...subscriptions, newSubWithId]);
        setNewSub({ name: "", cost: "", nextRenewal: "" });
        setIsOpen(false);
        // Temporary alert to confirm success on frontend
        alert(`Subscription ${newSub.name} added successfully!`);
      } catch (error) {
        console.error("Error adding subscription: ", error);
        alert(`Error adding subscription: ${error}`);
      }
    } else {
      console.warn("Validation failed", { newSub, user });
      if (!user) alert("User not authenticated!");
      else alert("Please fill in all fields.");
    }
  };

  const handleDeleteClick = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!user || !deleteId) return;

    try {
      await deleteDoc(doc(db, "users", user.uid, "subscriptions", deleteId));
      setSubscriptions(subscriptions.filter((s) => s.id !== deleteId));
      setDeleteId(null);
    } catch (error) {
      console.error("Error deleting subscription:", error);
    }
  };

  const totalMonthly = subscriptions
    .filter((s) => s.isActive)
    .reduce((sum, s) => sum + s.cost, 0);

  const potentialSavings = subscriptions
    .filter((s) => s.recommendation === "cancel")
    .reduce((sum, s) => sum + s.cost, 0);

  const upcomingRenewals = subscriptions
    .filter((s) => s.isActive)
    .filter((s) => {
      const daysUntil = Math.ceil(
        (new Date(s.nextRenewal).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntil <= 7;
    });

  return (
    <div className="space-y-6">
      {/* Priority Action Strip */}
      {potentialSavings > 0 && (
        <div className="group relative rounded-xl border border-warning/30 bg-warning/5 p-0.5 overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="absolute inset-0 bg-gradient-to-r from-warning/20 via-transparent to-warning/10 opacity-50" />
          <div className="relative rounded-[10px] bg-card/40 backdrop-blur-md p-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10 text-warning shadow-inner">
                <span className="text-lg">🚨</span>
              </div>
              <p className="text-sm text-foreground">
                <span className="font-bold text-warning uppercase tracking-tighter mr-2">Action Needed:</span>
                Cancel <span className="font-bold">{subscriptions.filter((s) => s.recommendation === "cancel").length} unused subscriptions</span> before renewal to save <span className="font-bold text-success-foreground">₹{potentialSavings.toLocaleString()}/month</span>.
              </p>
            </div>
            <button className="hidden sm:block text-xs font-bold bg-warning text-warning-foreground px-4 py-1.5 rounded-lg shadow-sm hover:opacity-90 transition-all active:scale-95">
              Review Recommendations
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Subscriptions</h1>
          <p className="text-muted-foreground">
            Track and optimize your recurring payments
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Subscription
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Subscription</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="sub-name">Subscription Name</Label>
                <Input
                  id="sub-name"
                  placeholder="e.g., Netflix, Spotify"
                  value={newSub.name}
                  onChange={(e) => setNewSub({ ...newSub, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sub-cost">Monthly Cost (₹)</Label>
                <Input
                  id="sub-cost"
                  type="number"
                  placeholder="199"
                  value={newSub.cost}
                  onChange={(e) => setNewSub({ ...newSub, cost: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sub-renewal">Next Renewal Date</Label>
                <Input
                  id="sub-renewal"
                  type="date"
                  value={newSub.nextRenewal}
                  onChange={(e) => setNewSub({ ...newSub, nextRenewal: e.target.value })}
                />
              </div>
              <Button onClick={handleAddSubscription} className="w-full">
                Add Subscription
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-card p-6 shadow-card border border-border/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <IndianRupee className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly Spend</p>
              <p className="text-xl font-bold">₹{totalMonthly.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-card p-6 shadow-card border border-border/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-soft">
              <IndianRupee className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Potential Savings</p>
              <p className="text-xl font-bold text-success">
                ₹{potentialSavings.toLocaleString()}/mo
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-card p-6 shadow-card border border-border/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-soft">
              <Calendar className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Renewing Soon</p>
              <p className="text-xl font-bold text-warning">
                {upcomingRenewals.length} this week
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Recommendation */}
      {potentialSavings > 0 && (
        <div className="rounded-xl bg-success-soft border border-success/20 p-4">
          <p className="text-sm text-success">
            💡 <strong>AI Insight:</strong> You could save ₹{potentialSavings.toLocaleString()}/month
            by cancelling {subscriptions.filter((s) => s.recommendation === "cancel").length} unused or rarely-used subscriptions.
          </p>
        </div>
      )}

      {/* Subscription Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...subscriptions]
          .sort((a, b) => {
            const getPriority = (sub: Subscription) => {
              const daysUntil = Math.ceil(
                (new Date(sub.nextRenewal).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              );
              if (sub.isActive && sub.recommendation === "cancel") return 0;
              if (sub.isActive && daysUntil <= 7) return 1;
              if (sub.isActive) return 2;
              return 3;
            };
            return getPriority(a) - getPriority(b);
          })
          .map((sub, index) => (
            <div
              key={sub.id}
              className={cn(
                "rounded-xl bg-card p-5 shadow-card border transition-all animate-fade-in group hover:scale-[1.01]",
                !sub.isActive
                  ? "border-muted opacity-50 grayscale"
                  : sub.recommendation === "cancel"
                    ? "border-warning/60 bg-warning/[0.02] shadow-sm shadow-warning/5"
                    : Math.ceil(
                      (new Date(sub.nextRenewal).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                    ) <= 7
                      ? "border-primary/40 shadow-sm"
                      : "border-border/30 opacity-80"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{sub.logo}</span>
                  <div>
                    <h3 className="font-semibold text-foreground">{sub.name}</h3>
                    <p className="text-xs text-muted-foreground">{sub.category}</p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-4">
                  <div>
                    <p className="font-semibold">₹{sub.cost}</p>
                    <p className="text-xs text-muted-foreground">/month</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={(e) => handleDeleteClick(sub.id, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Renews{" "}
                    {new Date(sub.nextRenewal).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
                {!sub.isActive && <span className="text-xs font-medium text-muted-foreground">Inactive</span>}
              </div>

              {sub.recommendation === "cancel" && sub.isActive && (
                <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-warning-soft px-3 py-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-warning" />
                    <span className="text-xs font-medium text-warning">Consider cancelling</span>
                  </div>
                  <span className="text-[10px] font-bold text-success-foreground bg-success/10 px-1.5 py-0.5 rounded">
                    💰 Saves ₹{sub.cost}/mo
                  </span>
                </div>
              )}
            </div>
          ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this subscription.
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
