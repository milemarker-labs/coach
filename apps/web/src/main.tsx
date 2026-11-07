import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { AppShell } from "@/components/shell/app-shell.tsx";
import { ActivitiesPage } from "@/features/activities/activities-page.tsx";
import { ActivityDetailPage } from "@/features/activities/activity-detail-page.tsx";
import { CoachPage } from "@/features/coach/coach-page.tsx";
import { DashboardPage } from "@/features/dashboard/dashboard-page.tsx";
import { InsightsPage } from "@/features/insights/insights-page.tsx";
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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/activities" element={<ActivitiesPage />} />
            <Route path="/activities/:id" element={<ActivityDetailPage />} />
            <Route path="/training" element={<TrainingPage />} />
            <Route path="/insights" element={<InsightsPage />} />
            <Route path="/coach" element={<CoachPage />} />
            <Route path="/sync" element={<SyncPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            {/* Earlier routes */}
            <Route path="/import" element={<Navigate to="/sync" replace />} />
            <Route path="/analytics" element={<Navigate to="/insights" replace />} />
            <Route path="/goals" element={<Navigate to="/training" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
