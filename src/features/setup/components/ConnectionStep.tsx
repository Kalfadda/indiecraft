import { useState } from "react";
import { motion } from "motion/react";
import { Database, Loader2, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { validateConnection } from "../../../lib/supabaseConfig";

interface ConnectionStepProps {
  onComplete: (url: string, anonKey: string) => void;
  initialUrl?: string;
  initialKey?: string;
}

export function ConnectionStep({ onComplete, initialUrl = "", initialKey = "" }: ConnectionStepProps) {
  const [url, setUrl] = useState(initialUrl);
  const [anonKey, setAnonKey] = useState(initialKey);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    const result = await validateConnection(url, anonKey);
    setTestResult(result);
    setTesting(false);

    if (result.success) {
      // Auto-advance after successful test
      setTimeout(() => onComplete(url, anonKey), 1000);
    }
  };

  const isValidUrl = url.startsWith("https://") && url.includes(".supabase.co");
  const isValidKey = anonKey.length > 100;
  const canTest = isValidUrl && isValidKey;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div
          style={{
            display: "inline-flex",
            width: 64,
            height: 64,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 16,
            backgroundColor: "#7c3aed",
            marginBottom: 16,
          }}
        >
          <Database style={{ width: 32, height: 32, color: "#fff" }} />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 600, color: "#1e1e2e", margin: 0 }}>
          Connect to Supabase
        </h2>
        <p style={{ color: "#6b7280", marginTop: 8 }}>
          Enter your Supabase project credentials to get started.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label
            style={{
              display: "block",
              fontSize: 14,
              fontWeight: 500,
              color: "#374151",
              marginBottom: 6,
            }}
          >
            Supabase Project URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setTestResult(null);
            }}
            placeholder="https://your-project.supabase.co"
            style={{
              width: "100%",
              padding: "12px 16px",
              fontSize: 14,
              color: "#1e1e2e",
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: 14,
              fontWeight: 500,
              color: "#374151",
              marginBottom: 6,
            }}
          >
            Anon (Public) Key
          </label>
          <textarea
            value={anonKey}
            onChange={(e) => {
              setAnonKey(e.target.value);
              setTestResult(null);
            }}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            rows={3}
            style={{
              width: "100%",
              padding: "12px 16px",
              fontSize: 14,
              fontFamily: "monospace",
              color: "#1e1e2e",
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              outline: "none",
              resize: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      <a
        href="https://supabase.com/dashboard/project/_/settings/api"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          color: "#7c3aed",
          fontSize: 14,
          textDecoration: "none",
        }}
      >
        <ExternalLink style={{ width: 14, height: 14 }} />
        Find these in Supabase Dashboard &gt; Settings &gt; API
      </a>

      {testResult && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: 12,
            borderRadius: 8,
            backgroundColor: testResult.success ? "#dcfce7" : "#fee2e2",
            color: testResult.success ? "#166534" : "#991b1b",
          }}
        >
          {testResult.success ? (
            <>
              <CheckCircle style={{ width: 20, height: 20 }} />
              <span>Connection successful!</span>
            </>
          ) : (
            <>
              <XCircle style={{ width: 20, height: 20 }} />
              <span>{testResult.error || "Connection failed"}</span>
            </>
          )}
        </motion.div>
      )}

      <button
        onClick={handleTest}
        disabled={!canTest || testing}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "14px 24px",
          fontSize: 16,
          fontWeight: 600,
          color: "#fff",
          backgroundColor: canTest ? "#7c3aed" : "#9ca3af",
          border: "none",
          borderRadius: 8,
          cursor: canTest && !testing ? "pointer" : "not-allowed",
          transition: "background-color 0.2s",
        }}
      >
        {testing ? (
          <>
            <Loader2 style={{ width: 20, height: 20, animation: "spin 1s linear infinite" }} />
            Testing Connection...
          </>
        ) : (
          "Test Connection"
        )}
      </button>
    </motion.div>
  );
}
