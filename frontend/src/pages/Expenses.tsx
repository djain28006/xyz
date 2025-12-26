import { useState, useEffect, useRef } from "react";
import { Search, Filter, Calendar, TrendingUp, ArrowUpRight, PieChart, Sparkles, Plus, Trash2, Upload, FileSpreadsheet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Label } from "@/components/ui/label";
import { CategoryBadge, CategoryType } from "@/components/ui/category-badge";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, writeBatch } from "firebase/firestore";
import * as XLSX from "xlsx";

interface Transaction {
  id: string; // Changed to string for Firestore ID
  date: string;
  description: string;
  category: CategoryType;
  amount: number;
}

export default function Expenses() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [expenseList, setExpenseList] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Add/Delete State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    category: "other",
    date: new Date().toISOString().split('T')[0]
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const fetchExpenses = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const q = query(collection(db, "users", user.uid, "expenses"), orderBy("date", "desc"));
        const querySnapshot = await getDocs(q);
        const fetchedExpenses: Transaction[] = [];
        querySnapshot.forEach((doc) => {
          fetchedExpenses.push({ id: doc.id, ...doc.data() } as Transaction);
        });
        setExpenseList(fetchedExpenses);
      } catch (error) {
        console.error("Error fetching expenses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, [user]);

  const handleAddExpense = async () => {
    if (!user || !newExpense.description || !newExpense.amount) return;

    try {
      const expenseData = {
        description: newExpense.description,
        amount: parseFloat(newExpense.amount),
        category: newExpense.category as CategoryType,
        date: newExpense.date,
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, "users", user.uid, "expenses"), expenseData);

      const newTransaction: Transaction = {
        id: docRef.id,
        ...expenseData
      };

      setExpenseList([newTransaction, ...expenseList]);
      setNewExpense({
        description: "",
        amount: "",
        category: "other",
        date: new Date().toISOString().split('T')[0]
      });
      setIsAddOpen(false);
    } catch (error) {
      console.error("Error adding expense:", error);
      alert("Failed to add expense");
    }
  };

  const confirmDelete = async () => {
    if (!user || !deleteId) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "expenses", deleteId));
      setExpenseList(expenseList.filter(e => e.id !== deleteId));
      setDeleteId(null);
    } catch (error) {
      console.error("Error deleting expense:", error);
    }
  };

  // Excel Upload Logic
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Strict File Type Validation
    const validExtensions = [".xlsx", ".xls", ".csv"];
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
      alert("Invalid file type! Please upload only Excel (.xlsx, .xls) or CSV files.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setLoading(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        const batch = writeBatch(db);
        const newTransactions: Transaction[] = [];

        data.forEach((row: any) => {
          // Categorization Logic: Prioritize Excel 'Category' column, otherwise use AI Heuristic
          let category: CategoryType = "other";

          // Helper to safely get string value with fuzzy key matching
          const getVal = (key: string) => {
            // 1. Direct match
            if (row[key]) return row[key].toString().trim();
            // 2. Lowercase match
            if (row[key.toLowerCase()]) return row[key.toLowerCase()].toString().trim();
            // 3. Fuzzy search in keys
            const foundKey = Object.keys(row).find(k => k.toLowerCase().trim().includes(key.toLowerCase()));
            return foundKey ? row[foundKey].toString().trim() : "";
          };

          let rowCategory = getVal("Category").toLowerCase();
          const descLower = getVal("Description").toLowerCase();

          // Category Synonym Mapping (User might use different words)
          const categoryMap: Record<string, CategoryType> = {
            "transport": "travel", "cab": "travel", "commute": "travel", "fuel": "travel",
            "dining": "food", "restaurants": "food", "groceries": "food", "snacks": "food",
            "movies": "entertainment", "fun": "entertainment",
            "rent": "emi", "house": "emi",
            "bills": "utilities", "mobile": "utilities",
            "clothes": "shopping", "apparel": "shopping",
            "meds": "health", "pharmacy": "health"
          };
          if (categoryMap[rowCategory]) rowCategory = categoryMap[rowCategory];

          const validCategories: CategoryType[] = ["food", "travel", "emi", "utilities", "entertainment", "shopping", "health", "other"];

          if (rowCategory && validCategories.includes(rowCategory as CategoryType)) {
            category = rowCategory as CategoryType;
          } else {
            // Fallback to Heuristic matching
            if (descLower.match(/food|restaurant|swiggy|zomato|pizza|burger|coffee|cafe|tea|lunch|dinner|groceries|mart|blinkit|zepto/)) category = "food";
            else if (descLower.match(/uber|ola|taxi|train|bus|flight|fuel|petrol|diesel|parking|toll|rapido|metro/)) category = "travel";
            else if (descLower.match(/rent|emi|loan|mortgage|house|flat|maintenance|deposit/)) category = "emi";
            else if (descLower.match(/bill|electricity|water|gas|wifi|internet|mobile|recharge|netflix|spotify|prime|hulu|disney|hotstar/)) category = "utilities";
            else if (descLower.match(/movie|cinema|game|concert|party|drink|bar|pub|club|event|ticket/)) category = "entertainment";
            else if (descLower.match(/shop|amazon|flipkart|myntra|clothes|shoes|mall|store|zara|h&m|nike|adidas/)) category = "shopping";
            else if (descLower.match(/doctor|medicine|hospital|pharmacy|gym|fitness|health|yoga|meds|checkup/)) category = "health";
          }

          const amount = parseFloat(row.Amount || row.amount || 0);
          if (amount > 0) {
            const newDocRef = doc(collection(db, "users", user.uid, "expenses"));
            const transactionData = {
              description: row.Description || row.description || "Imported Expense",
              amount: amount,
              category: category,
              date: row.Date || row.date || new Date().toISOString().split('T')[0],
              isImported: true,
              createdAt: new Date().toISOString()
            };

            batch.set(newDocRef, transactionData);
            newTransactions.push({ id: newDocRef.id, ...transactionData });
          }
        });

        await batch.commit();
        setExpenseList([...newTransactions, ...expenseList]);
        alert(`Successfully imported ${newTransactions.length} expenses!`);

      } catch (error) {
        console.error("Error parsing Excel:", error);
        alert("Failed to parse Excel file. Please ensure it has 'Date', 'Description', and 'Amount' columns.");
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    reader.readAsBinaryString(file);
  };

  const filteredTransactions = expenseList.filter((t) => {
    const description = t.description || "";
    const matchesSearch = description
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalExpenses = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

  // Calculate category totals
  const categoryTotals = filteredTransactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const sortedCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  const maxCategoryAmount = Math.max(...Object.values(categoryTotals), 0);
  // Find highest category for insights
  const highestCategoryObj = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a)[0];
  const highestCategoryName = highestCategoryObj ? highestCategoryObj[0] : "None";
  const highestCategoryVal = highestCategoryObj ? highestCategoryObj[1] : 0;
  const highestCategoryPct = totalExpenses > 0 ? Math.round((highestCategoryVal / totalExpenses) * 100) : 0;


  const categoryColors: Record<string, string> = {
    food: "hsl(38, 92%, 50%)",
    travel: "hsl(199, 89%, 48%)",
    entertainment: "hsl(280, 65%, 60%)",
    utilities: "hsl(220, 9%, 46%)",
    shopping: "hsl(234, 89%, 54%)",
    health: "hsl(142, 76%, 36%)",
    emi: "hsl(0, 84%, 60%)",
    other: "hsl(var(--muted-foreground))"
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Expenses</h1>
          <p className="text-muted-foreground">
            Track and manage your transactions
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-gradient-to-br from-red-500/10 to-transparent px-6 py-4 shadow-sm border border-red-500/20 hidden md:block backdrop-blur-md">
            <p className="text-sm font-medium text-red-400">Monthly Total</p>
            <p className="text-2xl font-bold text-red-500 tracking-tight">
              ₹{totalExpenses.toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <Button
              variant="outline"
              size="lg"
              className="h-full aspect-square p-0 sm:aspect-auto sm:px-4 gap-2 border-emerald-500/20 hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/30 transition-all duration-300"
              onClick={() => fileInputRef.current?.click()}
              title="Import Excel"
            >
              <FileSpreadsheet className="h-5 w-5" />
              <span className="hidden sm:inline font-medium">Import</span>
            </Button>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="h-full aspect-square p-0 sm:aspect-auto sm:px-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20 transition-all duration-300">
                  <Plus className="h-6 w-6 sm:mr-2" />
                  <span className="hidden sm:inline font-semibold">Add Expense</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Expense</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      placeholder="Dinner, Uber, etc."
                      value={newExpense.description}
                      onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Amount (₹)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={newExpense.category}
                      onValueChange={(val) => setNewExpense({ ...newExpense, category: val })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="food">Food</SelectItem>
                        <SelectItem value="travel">Travel</SelectItem>
                        <SelectItem value="emi">EMI/Rent</SelectItem>
                        <SelectItem value="utilities">Utilities</SelectItem>
                        <SelectItem value="entertainment">Entertainment</SelectItem>
                        <SelectItem value="shopping">Shopping</SelectItem>
                        <SelectItem value="health">Health</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={newExpense.date}
                      onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleAddExpense} className="w-full">Save Expense</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 bg-card/50 border-input/50 focus:bg-card transition-colors"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="food">Food</SelectItem>
            <SelectItem value="travel">Travel</SelectItem>
            <SelectItem value="emi">EMI</SelectItem>
            <SelectItem value="utilities">Utilities</SelectItem>
            <SelectItem value="entertainment">Entertainment</SelectItem>
            <SelectItem value="shopping">Shopping</SelectItem>
            <SelectItem value="health">Health</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* AI Suggestion */}
      {totalExpenses > 0 && (
        <div className="rounded-xl p-[1px] bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20">
          <div className="rounded-xl bg-card/40 backdrop-blur-md p-4 flex items-center gap-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5" />
            <div className="rounded-full bg-indigo-500/10 p-2.5 text-indigo-400 shrink-0 relative z-10 ring-1 ring-indigo-500/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-primary">Smart Tip:</span> You've spent <span className="font-medium text-foreground">₹{highestCategoryVal.toLocaleString()}</span> on {highestCategoryName} this month.
              {highestCategoryPct > 30 ? " Consider setting a stricter budget for this category." : " Your spending looks balanced!"}
            </p>
          </div>
        </div>
      )}

      {/* Expense Insights */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="group rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm p-5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-amber-500/10 p-3 text-amber-500 group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Highest Category</p>
              <p className="text-sm font-semibold text-foreground capitalize">{highestCategoryName} <span className="text-muted-foreground text-xs ml-1">({highestCategoryPct}%)</span></p>
            </div>
          </div>
        </div>

        <div className="group rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm p-5 shadow-sm hover:shadow-md hover:border-rose-500/20 transition-all duration-300">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-rose-500/10 p-3 text-rose-500 group-hover:scale-110 transition-transform duration-300">
              <ArrowUpRight className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Transaction Count</p>
              <p className="text-sm font-semibold text-foreground">{filteredTransactions.length} <span className="text-xs text-muted-foreground font-normal">items</span></p>
            </div>
          </div>
        </div>

        <div className="group rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm p-5 shadow-sm hover:shadow-md hover:border-blue-500/20 transition-all duration-300">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-blue-500/10 p-3 text-blue-500 group-hover:scale-110 transition-transform duration-300">
              <PieChart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Daily Average</p>
              <p className="text-sm font-semibold text-foreground">₹{expenseList.length > 0 ? Math.round(totalExpenses / 30).toLocaleString() : 0} <span className="text-muted-foreground text-xs ml-1">/ day</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Visual Summary */}
      <div className="rounded-xl border-2 border-border bg-card p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground mb-4">Where your money goes</h3>
        <div className="space-y-4">
          {sortedCategories.map(([category, amount]) => (
            <div key={category} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="capitalize text-muted-foreground">{category}</span>
                  <span className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                    {Math.round((amount / totalExpenses) * 100)}%
                  </span>
                </div>
                <span className="font-medium text-foreground">₹{amount.toLocaleString()}</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(amount / maxCategoryAmount) * 100}%`,
                    backgroundColor: categoryColors[category] || "hsl(var(--primary))"
                  }}
                />
              </div>
            </div>
          ))}
          {sortedCategories.length === 0 && <p className="text-sm text-muted-foreground">No expenses recorded yet.</p>}
        </div>
      </div>

      {/* Transactions Table */}
      {/* Transactions Table */}
      <div className="rounded-2xl bg-card/40 border border-border/50 shadow-sm backdrop-blur-sm overflow-hidden">
        <div className="overflow-auto max-h-[600px] relative">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 bg-white/5 sticky top-0 z-10 backdrop-blur-md">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Description
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Category
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Amount
                </th>
                <th className="px-6 py-4 w-[50px]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTransactions.map((transaction, index) => (
                <tr
                  key={transaction.id}
                  className="group transition-all duration-200 hover:bg-white/5 border-b border-white/5 last:border-0"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                    {new Date(transaction.date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-foreground">
                    {transaction.description}
                  </td>
                  <td className="px-6 py-4">
                    <CategoryBadge category={transaction.category} />
                  </td>
                  <td className={`whitespace-nowrap px-6 py-4 text-right text-sm font-semibold ${["food", "shopping", "entertainment", "travel"].includes(transaction.category)
                    ? "text-danger"
                    : "text-foreground"
                    }`}>
                    -₹{transaction.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteId(transaction.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredTransactions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No transactions found</p>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this transaction records.
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
