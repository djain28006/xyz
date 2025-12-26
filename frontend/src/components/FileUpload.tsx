import { useState } from "react";
import { Upload, AlertCircle, CheckCircle2 } from "lucide-react";

interface FileUploadProps {
  onUploadSuccess: (fileId: string) => void;
  isLoading?: boolean;
}

export function FileUpload({ onUploadSuccess, isLoading = false }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    // Validate file type
    if (!selected.name.match(/\.(csv|xlsx?|xls)$/i)) {
      setError("Please upload a CSV or Excel file (.csv, .xlsx, .xls)");
      return;
    }

    setFile(selected);
    setError(null);
    setSuccess(false);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
      const response = await fetch(`${backendUrl}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Upload failed");
      }

      const data = await response.json();
      setSuccess(true);
      setFile(null);

      // Call the success callback with file ID
      onUploadSuccess(data.file_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 border-2 border-dashed border-border rounded-lg bg-card">
      <div className="space-y-4">
        <div className="text-center">
          <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
          <h3 className="text-lg font-semibold">Upload Financial Data</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Upload a CSV or Excel file with your financial data (expenses, investments, goals)
          </p>
        </div>

        <div className="space-y-2">
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileSelect}
            disabled={uploading || isLoading}
            className="block w-full text-sm border border-input rounded-lg cursor-pointer focus:outline-none px-3 py-2"
          />
          {file && <p className="text-sm text-foreground">Selected: {file.name}</p>}
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-green-600">File uploaded successfully! Displaying your data...</p>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || uploading || isLoading}
          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? "Uploading..." : "Upload & Analyze"}
        </button>

        <p className="text-xs text-muted-foreground text-center">
          📋 CSV format: date, category, amount (for expenses)<br />
          📊 Or: type, amount, return (for investments)<br />
          🎯 Or: name, target, current, deadline (for goals)
        </p>
      </div>
    </div>
  );
}
