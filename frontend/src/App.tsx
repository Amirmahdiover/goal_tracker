import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { SOFT_ERROR_MESSAGE, getGoal, isNotFoundError } from "./lib/api";
import { ensureUserId } from "./lib/user";
import { AddTrackingPage } from "./pages/AddTrackingPage";
import { ConcernInputPage } from "./pages/ConcernInputPage";
import { ConcernNotesPage } from "./pages/ConcernNotesPage";
import { CreateGoalPage } from "./pages/CreateGoalPage";
import { CreateStepsPage } from "./pages/CreateStepsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { EditGoalPage } from "./pages/EditGoalPage";
import { OnboardingIntroPage } from "./pages/OnboardingIntroPage";
import { SelectConcernPage } from "./pages/SelectConcernPage";
import { TrackingHistoryPage } from "./pages/TrackingHistoryPage";

function App() {
  const [isReady, setIsReady] = useState(false);
  const [startupError, setStartupError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function startApp() {
      try {
        await ensureUserId();
        await getGoal().catch((error: unknown) => {
          if (!isNotFoundError(error)) {
            throw error;
          }
        });
      } catch {
        if (isMounted) {
          setStartupError(SOFT_ERROR_MESSAGE);
        }
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    }

    void startApp();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isReady) {
    return (
      <main className="app-shell" dir="rtl">
        <section className="card loading-card">در حال آماده‌سازی...</section>
      </main>
    );
  }

  if (startupError) {
    return (
      <main className="app-shell" dir="rtl">
        <section className="card">
          <p className="error-banner">{startupError}</p>
        </section>
      </main>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<OnboardingIntroPage />} />
      <Route path="/concerns/new" element={<ConcernInputPage />} />
      <Route path="/concerns/select" element={<SelectConcernPage />} />
      <Route path="/goal/new" element={<CreateGoalPage />} />
      <Route path="/steps/new" element={<CreateStepsPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/tracking/add/:stepId" element={<AddTrackingPage />} />
      <Route path="/tracking/history" element={<TrackingHistoryPage />} />
      <Route path="/concerns" element={<ConcernNotesPage />} />
      <Route path="/goal/edit" element={<EditGoalPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
