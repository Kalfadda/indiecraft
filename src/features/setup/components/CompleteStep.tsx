import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { CheckCircle, XCircle, Loader2, RefreshCw, Rocket } from "lucide-react";
import { checkSchemaExists, saveConfig } from "../../../lib/supabaseConfig";

interface CompleteStepProps {
  supabaseUrl: string;
  supabaseAnonKey: string;
  onComplete: () => void;
  onBack: () => void;
}

export function CompleteStep({ supabaseUrl, supabaseAnonKey, onComplete, onBack }: CompleteStepProps) {
  const [checking, setChecking] = useState(true);
  const [schemaResult, setSchemaResult] = useState<{
    exists: boolean;
    missingTables: string[];
  } | null>(null);
  const [saving, setSaving] = useState(false);

  const verifySchema = async () => {
    setChecking(true);
    setSchemaResult(null);

    try {
      const result = await checkSchemaExists();
      setSchemaResult(result);
    } catch (error) {
      console.error("Schema verification failed:", error);
      setSchemaResult({ exists: false, missingTables: ["Failed to verify"] });
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    verifySchema();
  }, []);

  const handleFinish = async () => {
    setSaving(true);
    try {
      await saveConfig({
        supabaseUrl,
        supabaseAnonKey,
        schemaInitialized: true,
      });
      onComplete();
    } catch (error) {
      console.error("Failed to save config:", error);
    } finally {
      setSaving(false);
    }
  };

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
            backgroundColor: schemaResult?.exists ? "#16a34a" : checking ? "#6b7280" : "#ef4444",
            marginBottom: 16,
            transition: "background-color 0.3s",
          }}
        >
          {checking ? (
            <Loader2
              style={{ width: 32, height: 32, color: "#fff", animation: "spin 1s linear infinite" }}
            />
          ) : schemaResult?.exists ? (
            <CheckCircle style={{ width: 32, height: 32, color: "#fff" }} />
          ) : (
            <XCircle style={{ width: 32, height: 32, color: "#fff" }} />
          )}
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 600, color: "#1e1e2e", margin: 0 }}>
          {checking
            ? "Verifying Setup..."
            : schemaResult?.exists
              ? "Setup Complete!"
              : "Schema Not Found"}
        </h2>
        <p style={{ color: "#6b7280", marginTop: 8 }}>
          {checking
            ? "Checking if the database tables were created..."
            : schemaResult?.exists
              ? "Your database is ready. Click below to start using the app."
              : "Some required tables are missing from your database."}
        </p>
      </div>

      {schemaResult && !schemaResult.exists && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 12,
            padding: 16,
          }}
        >
          <h4 style={{ margin: "0 0 8px 0", color: "#991b1b", fontSize: 14, fontWeight: 600 }}>
            Missing Tables:
          </h4>
          <ul
            style={{
              margin: 0,
              paddingLeft: 20,
              color: "#b91c1c",
              fontSize: 14,
            }}
          >
            {schemaResult.missingTables.map((table) => (
              <li key={table}>{table}</li>
            ))}
          </ul>
          <p style={{ margin: "12px 0 0 0", color: "#7f1d1d", fontSize: 13 }}>
            Please go back and make sure you ran the complete SQL schema in the Supabase SQL
            Editor.
          </p>
        </motion.div>
      )}

      {schemaResult?.exists && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: 12,
            padding: 16,
            textAlign: "center",
          }}
        >
          <p style={{ margin: 0, color: "#166534", fontSize: 14 }}>
            All required tables have been created successfully!
          </p>
        </motion.div>
      )}

      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        {!schemaResult?.exists && (
          <button
            onClick={onBack}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "14px 24px",
              fontSize: 16,
              fontWeight: 600,
              color: "#374151",
              backgroundColor: "#fff",
              border: "2px solid #e5e7eb",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Go Back
          </button>
        )}

        {!schemaResult?.exists ? (
          <button
            onClick={verifySchema}
            disabled={checking}
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
              backgroundColor: "#7c3aed",
              border: "none",
              borderRadius: 8,
              cursor: checking ? "not-allowed" : "pointer",
            }}
          >
            {checking ? (
              <>
                <Loader2
                  style={{ width: 20, height: 20, animation: "spin 1s linear infinite" }}
                />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw style={{ width: 20, height: 20 }} />
                Check Again
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleFinish}
            disabled={saving}
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
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? (
              <>
                <Loader2
                  style={{ width: 20, height: 20, animation: "spin 1s linear infinite" }}
                />
                Saving...
              </>
            ) : (
              <>
                <Rocket style={{ width: 20, height: 20 }} />
                Launch App
              </>
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
}
