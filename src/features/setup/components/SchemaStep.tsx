import { useState } from "react";
import { motion } from "motion/react";
import { FileCode, Copy, Check, ExternalLink, ArrowRight, AlertCircle } from "lucide-react";
import { open } from "@tauri-apps/plugin-shell";
import { SCHEMA_SQL } from "../schema";

interface SchemaStepProps {
  supabaseUrl: string;
  onComplete: () => void;
}

export function SchemaStep({ supabaseUrl, onComplete }: SchemaStepProps) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SCHEMA_SQL);
      setCopied(true);
      setError(null);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      setError("Failed to copy to clipboard");
    }
  };

  const handleOpenUrl = async (url: string) => {
    try {
      await open(url);
    } catch (err) {
      console.error("Failed to open URL:", err);
      setError("Failed to open browser. Please open manually: " + url);
    }
  };

  // Extract project ID from URL for direct link
  const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || "_";
  const sqlEditorUrl = `https://supabase.com/dashboard/project/${projectId}/sql/new`;

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
            backgroundColor: "#f59e0b",
            marginBottom: 16,
          }}
        >
          <FileCode style={{ width: 32, height: 32, color: "#fff" }} />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 600, color: "#1e1e2e", margin: 0 }}>
          Set Up Database Schema
        </h2>
        <p style={{ color: "#6b7280", marginTop: 8 }}>
          Copy the SQL schema and run it in your Supabase SQL Editor.
        </p>
      </div>

      <div
        style={{
          backgroundColor: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: 20,
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1e1e2e", margin: "0 0 16px 0" }}>
          Instructions:
        </h3>
        <ol
          style={{
            margin: 0,
            paddingLeft: 20,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            color: "#374151",
          }}
        >
          <li>Click "Copy Schema SQL" below to copy the database schema</li>
          <li>
            Click "Open SQL Editor" to open your Supabase project
          </li>
          <li>Paste the SQL and click "Run"</li>
          <li>
            Go to <strong>Authentication &gt; Providers &gt; Email</strong> and disable "Confirm
            email"
          </li>
          <li>Return here and click "Verify Setup"</li>
        </ol>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: 12,
            borderRadius: 8,
            backgroundColor: "#fee2e2",
            color: "#991b1b",
          }}
        >
          <AlertCircle style={{ width: 20, height: 20, flexShrink: 0 }} />
          <span style={{ fontSize: 14 }}>{error}</span>
        </motion.div>
      )}

      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={handleCopy}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "14px 24px",
            fontSize: 16,
            fontWeight: 600,
            color: "#fff",
            backgroundColor: copied ? "#16a34a" : "#7c3aed",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
        >
          {copied ? (
            <>
              <Check style={{ width: 20, height: 20 }} />
              Copied!
            </>
          ) : (
            <>
              <Copy style={{ width: 20, height: 20 }} />
              Copy Schema SQL
            </>
          )}
        </button>

        <button
          onClick={() => handleOpenUrl(sqlEditorUrl)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "14px 24px",
            fontSize: 16,
            fontWeight: 600,
            color: "#7c3aed",
            backgroundColor: "#fff",
            border: "2px solid #7c3aed",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          <ExternalLink style={{ width: 20, height: 20 }} />
          Open SQL Editor
        </button>
      </div>

      <div
        style={{
          borderTop: "1px solid #e5e7eb",
          paddingTop: 20,
          marginTop: 8,
        }}
      >
        <button
          onClick={onComplete}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "14px 24px",
            fontSize: 16,
            fontWeight: 600,
            color: "#fff",
            backgroundColor: "#16a34a",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
        >
          I've Run the SQL
          <ArrowRight style={{ width: 20, height: 20 }} />
        </button>
      </div>
    </motion.div>
  );
}
