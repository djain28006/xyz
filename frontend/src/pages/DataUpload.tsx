import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileUpload } from "@/components/FileUpload";

export default function DataUpload() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUploadSuccess = (fileId: string) => {
    setIsProcessing(true);
    // Store fileId in localStorage for persistence across page reloads
    localStorage.setItem("activeFileId", fileId);
    
    // Redirect to dashboard with file_id query param
    setTimeout(() => {
      navigate(`/dashboard?file_id=${fileId}`);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold text-foreground">FinGenius</h1>
          <h2 className="text-2xl font-semibold text-foreground">Upload Your Financial Data</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Upload your financial data (CSV or Excel) to get personalized financial analytics and AI-powered insights.
          </p>
        </div>

        <FileUpload onUploadSuccess={handleUploadSuccess} isLoading={isProcessing} />

        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-foreground">📋 File Format Guide</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium text-foreground">For Expenses:</p>
              <p className="text-muted-foreground">Columns: date, category, amount</p>
              <code className="block bg-muted p-2 rounded mt-1 text-xs">2024-12-01,Food & Dining,500</code>
            </div>
            <div>
              <p className="font-medium text-foreground">For Investments:</p>
              <p className="text-muted-foreground">Columns: type, amount, return</p>
              <code className="block bg-muted p-2 rounded mt-1 text-xs">Mutual Fund,50000,12</code>
            </div>
            <div>
              <p className="font-medium text-foreground">For Goals:</p>
              <p className="text-muted-foreground">Columns: name, target, current, deadline</p>
              <code className="block bg-muted p-2 rounded mt-1 text-xs">Emergency Fund,300000,150000,2025-12-31</code>
            </div>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <p className="text-sm text-blue-700 dark:text-blue-400">
            💡 Tip: You can always upload a new file to update your analytics. The system will process it immediately and show you updated insights.
          </p>
        </div>
      </div>
    </div>
  );
}
