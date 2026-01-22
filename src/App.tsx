import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthPage, ProtectedRoute } from "./features/auth";
import { Dashboard } from "./features/assets";
import { NotificationContainer } from "./components/notifications";
import { sendHeartbeat } from "./lib/heartbeat";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

function App() {
  // Ping database on startup to prevent Supabase free tier from pausing
  useEffect(() => {
    sendHeartbeat();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <NotificationContainer />
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
