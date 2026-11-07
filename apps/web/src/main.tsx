import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import { Shell } from "@/components/shell.tsx";
import { ActivitiesPage } from "@/features/activities/activities-page.tsx";
import { ActivityDetailPage } from "@/features/activities/activity-detail-page.tsx";
import { DashboardPage } from "@/features/dashboard/dashboard-page.tsx";
import { ImportPage } from "@/features/import/import-page.tsx";
import { PlaceholderPage } from "@/features/placeholders/placeholder-page.tsx";
import { SettingsPage } from "@/features/settings/settings-page.tsx";
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
        <Shell>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/activities" element={<ActivitiesPage />} />
            <Route path="/activities/:id" element={<ActivityDetailPage />} />
            <Route path="/import" element={<ImportPage />} />
            <Route
              path="/analytics"
              element={<PlaceholderPage title="Analytics" note="Distance, pace, speed, heart rate, and load will be calculated per sport in the database, then shown here." />}
            />
            <Route
              path="/coach"
              element={<PlaceholderPage title="Coach" note="The model comes after the history is trustworthy. Ollama stays on this machine and is never called from the cloud worker." />}
            />
            <Route
              path="/goals"
              element={<PlaceholderPage title="Goals" note="Race targets and personal bests wait until the activity history is in place." />}
            />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Shell>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
