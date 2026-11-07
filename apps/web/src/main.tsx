import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router";
import { AppShell } from "@/components/shell/app-shell.tsx";
import { useDataMode } from "@/data/mode.ts";
import { ActivitiesPage } from "@/features/activities/activities-page.tsx";
import { ActivityDetailPage } from "@/features/activities/activity-detail-page.tsx";
import { CoachPage } from "@/features/coach/coach-page.tsx";
import { DashboardPage } from "@/features/dashboard/dashboard-page.tsx";
import { InsightsPage } from "@/features/insights/insights-page.tsx";
import { JournalPage } from "@/features/journal/journal-page.tsx";
import { WaitingPage } from "@/features/auth/waiting-page.tsx";
import { BootScreen, PublicFrame } from "@/features/landing/public-frame.tsx";
import { LandingPage } from "@/features/landing/landing-page.tsx";
import { SettingsPage } from "@/features/settings/settings-page.tsx";
import { SyncPage } from "@/features/sync/sync-page.tsx";
import { TrainingPage } from "@/features/training/training-page.tsx";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const forcedDemo = import.meta.env.VITE_DEMO_DATA === "true";

function AppRoutes() {
  const { mode, auth } = useDataMode();
  const signedIn = mode === "live" || forcedDemo;
  const pending = !forcedDemo && auth?.status === "pending";

  return (
    <Routes>
      <Route path="/mangesh" element={<JournalPage />} />
      {mode === "loading" && !forcedDemo ? (
        <Route path="*" element={<BootScreen />} />
      ) : pending ? (
        <>
          <Route path="/waiting" element={<WaitingPage />} />
          <Route path="*" element={<Navigate to="/waiting" replace />} />
        </>
      ) : signedIn ? (
        <Route element={<SignedInApp />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/activities" element={<ActivitiesPage />} />
          <Route path="/activities/:id" element={<ActivityDetailPage />} />
          <Route path="/training" element={<TrainingPage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/coach" element={<CoachPage />} />
          <Route path="/sync" element={<SyncPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/import" element={<Navigate to="/sync" replace />} />
          <Route path="/analytics" element={<Navigate to="/insights" replace />} />
          <Route path="/goals" element={<Navigate to="/training" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      ) : (
        <>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/settings"
            element={
              <PublicFrame>
                <SettingsPage />
              </PublicFrame>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}
    </Routes>
  );
}

function SignedInApp() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
