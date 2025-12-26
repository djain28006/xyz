import { useState, useEffect } from "react";
import { User, Bell, Shield, CreditCard, HelpCircle, ChevronRight, Save, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";

const settingsGroups = [
  {
    title: "Account",
    items: [
      { icon: User, label: "Profile Settings", description: "Manage your personal information" },
      { icon: CreditCard, label: "Linked Accounts", description: "Connect your bank accounts" },
    ],
  },
  {
    title: "Preferences",
    items: [
      { icon: Bell, label: "Notifications", description: "Manage alerts and reminders" },
      { icon: Shield, label: "Privacy & Security", description: "Password and data settings" },
    ],
  },
  {
    title: "Support",
    items: [
      { icon: HelpCircle, label: "Help Center", description: "FAQs and support articles" },
    ],
  },
];

export default function Settings() {
  const { user } = useAuth();
  const [income, setIncome] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const fetchIncome = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setIncome(docSnap.data().monthly_income?.toString() || "");
        }
      } catch (error) {
        console.error("Error fetching income:", error);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchIncome();
  }, [user]);

  const handleSaveIncome = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const amount = parseFloat(income);
      if (isNaN(amount) || amount < 0) {
        toast.error("Please enter a valid amount");
        return;
      }

      const docRef = doc(db, "users", user.uid);
      await updateDoc(docRef, {
        monthly_income: amount,
        updatedAt: new Date().toISOString()
      });
      toast.success("Income updated successfully");
    } catch (error) {
      console.error("Error updating income:", error);
      toast.error("Failed to update income");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences
        </p>
      </div>

      {/* Profile Card */}
      <div className="rounded-xl bg-card p-6 shadow-card border border-border/50">
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || "User"} />
            <AvatarFallback className="bg-primary/10 text-primary">
              <User className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{user?.displayName || "User"}</h3>
            <p className="text-sm text-muted-foreground">{user?.email || "No email"}</p>
          </div>
        </div>

        <div className="grid gap-2 max-w-xs">
          <Label htmlFor="income">Monthly Income</Label>
          <div className="flex gap-2">
            <Input
              id="income"
              type="number"
              placeholder="50000"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
            />
            <Button onClick={handleSaveIncome} disabled={loading || initialLoading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Update your monthly income to recalculate budgets.</p>
        </div>
      </div>

      {/* Settings Groups */}
      {settingsGroups.map((group) => (
        <div key={group.title} className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground px-1">
            {group.title}
          </h3>
          <div className="rounded-xl bg-card shadow-card border border-border/50 overflow-hidden">
            {group.items.map((item, index) => (
              <button
                key={item.label}
                className={`w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors ${index !== 0 ? "border-t border-border" : ""
                  }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Notification Preferences */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground px-1">
          Notifications
        </h3>
        <div className="rounded-xl bg-card p-4 shadow-card border border-border/50 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Budget Alerts</p>
              <p className="text-sm text-muted-foreground">
                Get notified when you exceed budget limits
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Goal Progress</p>
              <p className="text-sm text-muted-foreground">
                Weekly updates on your savings goals
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Subscription Reminders</p>
              <p className="text-sm text-muted-foreground">
                Alerts before subscription renewals
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">AI Insights</p>
              <p className="text-sm text-muted-foreground">
                Personalized financial tips and insights
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-danger px-1">
          Danger Zone
        </h3>
        <div className="rounded-xl bg-danger-soft border border-danger/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
