import { Github, Twitter, Linkedin, Heart } from "lucide-react";

export function Footer() {
    return (
        <footer className="border-t border-border bg-card">
            <div className="mx-auto px-6 py-8 md:py-12">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                    <div className="flex flex-col gap-2">
                        <h3 className="text-lg font-bold text-foreground">FinGenius</h3>
                        <p className="text-sm text-muted-foreground">
                            Empowering your financial journey with AI-driven insights and smart tracking.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-foreground mb-3">Product</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><a href="/dashboard" className="hover:text-primary transition-colors">Dashboard</a></li>
                            <li><a href="/expenses" className="hover:text-primary transition-colors">Expenses</a></li>
                            <li><a href="/investments" className="hover:text-primary transition-colors">Investments</a></li>
                            <li><a href="/insights" className="hover:text-primary transition-colors">AI Insights</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-foreground mb-3">Legal</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Cookie Policy</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-foreground mb-3">Connect</h4>
                        <div className="flex gap-4">
                            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                                <Github className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                                <Twitter className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                                <Linkedin className="h-5 w-5" />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="mt-8 border-t border-border/40 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-muted-foreground">
                        © {new Date().getFullYear()} FinGenius. All rights reserved.
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span>Made with</span>
                        <Heart className="h-3 w-3 text-red-500 fill-red-500" />
                        <span>for SIES Hackathon</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
