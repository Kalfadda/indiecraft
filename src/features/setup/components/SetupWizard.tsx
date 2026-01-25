import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Box, ChevronLeft } from "lucide-react";
import { ConnectionStep } from "./ConnectionStep";
import { SchemaStep } from "./SchemaStep";
import { CompleteStep } from "./CompleteStep";
import { loadConfig, saveConfig } from "../../../lib/supabaseConfig";

interface SetupWizardProps {
  onComplete: () => void;
}

type Step = "connection" | "schema" | "complete";

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = useState<Step>("connection");
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseAnonKey, setSupabaseAnonKey] = useState("");

  // Load any existing config on mount
  useEffect(() => {
    loadConfig().then((config) => {
      if (config) {
        setSupabaseUrl(config.supabaseUrl || "");
        setSupabaseAnonKey(config.supabaseAnonKey || "");

        // If we have valid credentials, start at schema step
        if (config.supabaseUrl && config.supabaseAnonKey) {
          setStep("schema");
        }
      }
    });
  }, []);

  const handleConnectionComplete = async (url: string, key: string) => {
    setSupabaseUrl(url);
    setSupabaseAnonKey(key);

    // Save credentials (but not initialized yet)
    await saveConfig({
      supabaseUrl: url,
      supabaseAnonKey: key,
      schemaInitialized: false,
    });

    setStep("schema");
  };

  const handleSchemaComplete = () => {
    setStep("complete");
  };

  const handleBack = () => {
    if (step === "schema") {
      setStep("connection");
    } else if (step === "complete") {
      setStep("schema");
    }
  };

  const stepIndex = step === "connection" ? 0 : step === "schema" ? 1 : 2;

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f4f4f7",
        padding: 16,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}
      >
        <div
          style={{
            display: "flex",
            width: 48,
            height: 48,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 12,
            backgroundColor: "#7c3aed",
          }}
        >
          <Box style={{ width: 24, height: 24, color: "#fff" }} />
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: "#1e1e2e", margin: 0 }}>IndieCraft</h1>
      </motion.div>

      {/* Progress indicator */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 32,
        }}
      >
        {["Connect", "Schema", "Verify"].map((label, index) => (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                width: 28,
                height: 28,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                fontSize: 14,
                fontWeight: 600,
                backgroundColor:
                  index < stepIndex
                    ? "#16a34a"
                    : index === stepIndex
                      ? "#7c3aed"
                      : "#e5e7eb",
                color: index <= stepIndex ? "#fff" : "#6b7280",
                transition: "all 0.3s",
              }}
            >
              {index + 1}
            </div>
            <span
              style={{
                fontSize: 14,
                fontWeight: index === stepIndex ? 600 : 400,
                color: index <= stepIndex ? "#1e1e2e" : "#6b7280",
              }}
            >
              {label}
            </span>
            {index < 2 && (
              <div
                style={{
                  width: 32,
                  height: 2,
                  backgroundColor: index < stepIndex ? "#16a34a" : "#e5e7eb",
                  marginLeft: 8,
                  marginRight: 8,
                  transition: "background-color 0.3s",
                }}
              />
            )}
          </div>
        ))}
      </div>

      <motion.div
        layout
        style={{
          width: "100%",
          maxWidth: 480,
          backgroundColor: "#fff",
          borderRadius: 16,
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.08)",
          padding: 32,
          position: "relative",
        }}
      >
        {step !== "connection" && (
          <button
            onClick={handleBack}
            style={{
              position: "absolute",
              top: 16,
              left: 16,
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "6px 12px",
              fontSize: 14,
              color: "#6b7280",
              backgroundColor: "transparent",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            <ChevronLeft style={{ width: 16, height: 16 }} />
            Back
          </button>
        )}

        <AnimatePresence mode="wait">
          {step === "connection" && (
            <ConnectionStep
              key="connection"
              onComplete={handleConnectionComplete}
              initialUrl={supabaseUrl}
              initialKey={supabaseAnonKey}
            />
          )}
          {step === "schema" && (
            <SchemaStep
              key="schema"
              supabaseUrl={supabaseUrl}
              onComplete={handleSchemaComplete}
            />
          )}
          {step === "complete" && (
            <CompleteStep
              key="complete"
              supabaseUrl={supabaseUrl}
              supabaseAnonKey={supabaseAnonKey}
              onComplete={onComplete}
              onBack={handleBack}
            />
          )}
        </AnimatePresence>
      </motion.div>

      <p
        style={{
          marginTop: 24,
          fontSize: 13,
          color: "#9ca3af",
          textAlign: "center",
        }}
      >
        Need help? Check the{" "}
        <a
          href="https://supabase.com/docs"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#7c3aed", textDecoration: "none" }}
        >
          Supabase documentation
        </a>
      </p>
    </div>
  );
}
