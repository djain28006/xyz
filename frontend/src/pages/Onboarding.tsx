import { useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { DollarSign, ArrowRight, Loader2 } from "lucide-react";

export default function Onboarding() {
    const [salary, setSalary] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const monthlySalary = parseFloat(salary);

        if (isNaN(monthlySalary) || monthlySalary <= 0) {
            toast.error("Please enter a valid positive number for your salary.");
            setLoading(false);
            return;
        }

        try {
            const user = auth.currentUser;
            if (!user) {
                toast.error("You must be logged in to save your salary.");
                navigate("/login");
                return;
            }

            // Save salary to Firestore
            await setDoc(
                doc(db, "users", user.uid),
                {
                    monthly_income: monthlySalary,
                    updatedAt: new Date().toISOString()
                },
                { merge: true }
            );

            toast.success("Salary saved successfully!");
            navigate("/dashboard");
        } catch (error: any) {
            console.error("Error saving salary:", error);
            toast.error("Failed to save salary. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <Card className="w-full max-w-md border-border/50 shadow-lg">
                <CardHeader className="text-center space-y-2">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                        <DollarSign className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Welcome to FinGenius</CardTitle>
                    <CardDescription>
                        Let's get started by setting up your financial profile. What is your monthly income?
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="salary">Monthly Income</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                <Input
                                    id="salary"
                                    type="number"
                                    placeholder="e.g. 5000"
                                    className="pl-8"
                                    value={salary}
                                    onChange={(e) => setSalary(e.target.value)}
                                    min="0"
                                    step="100"
                                    required
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                This helps us calculate your budget and savings goals.
                            </p>
                        </div>

                        <Button
                            type="submit"
                            className="w-full group"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    Continue to Dashboard
                                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
