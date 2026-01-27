import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Loader2, Box } from "lucide-react";
import { AuthPage, ProtectedRoute } from "./features/auth";
import { Dashboard } from "./features/assets";
import { NotificationContainer } from "./components/notifications";
import { SetupWizard } from "./features/setup";
import { sendHeartbeat } from "./lib/heartbeat";
import { loadConfig, clearConfigCache } from "./lib/supabaseConfig";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

type AppState = "loading" | "setup" | "ready";

function LoadingScreen() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f4f4f7",
        gap: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          width: 64,
          height: 64,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 16,
          backgroundColor: "#7c3aed",
        }}
      >
        <Box style={{ width: 32, height: 32, color: "#fff" }} />
      </div>
      <Loader2
        style={{ width: 32, height: 32, color: "#7c3aed", animation: "spin 1s linear infinite" }}
      />
    </div>
  );
}

function App() {
  const [appState, setAppState] = useState<AppState>("loading");

  useEffect(() => {
    async function init() {
      try {
        const config = await loadConfig();

        if (!config?.supabaseUrl || !config?.supabaseAnonKey || !config?.schemaInitialized) {
          setAppState("setup");
        } else {
          // Config is valid, start the app
          sendHeartbeat();
          setAppState("ready");
        }
      } catch (error) {
        console.error("Failed to initialize app:", error);
        setAppState("setup");
      }
    }

    init();
  }, []);

  if (appState === "loading") {
    return <LoadingScreen />;
  }

  if (appState === "setup") {
    return (
      <SetupWizard
        onComplete={() => {
          sendHeartbeat();
          setAppState("ready");
        }}
      />
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <NotificationContainer />
        <Routes>
          <Route path="/login" element={<AuthPage onReconfigure={() => {
            clearConfigCache();
            setAppState("setup");
          }} />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
