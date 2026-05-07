import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { AppLayout } from "./components/AppLayout";
import { Card } from "./components/Card";
import { ErrorMessage } from "./components/ErrorMessage";
import { LoadingState } from "./components/LoadingState";
import { SOFT_ERROR_MESSAGE, getGoal, isNotFoundError } from "./lib/api";
import { hasSeenOnboarding } from "./lib/onboarding";
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
      <AppLayout showHeader={false}>
        <Card className="startup-card">
          <LoadingState text="داریم فضای آرامت را آماده می‌کنیم..." />
        </Card>
      </AppLayout>
    );
  }

  if (startupError) {
    return (
      <AppLayout showHeader={false}>
        <Card className="startup-card">
          <ErrorMessage message={startupError} />
        </Card>
      </AppLayout>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<OnboardingGate />} />
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

function OnboardingGate() {
  const [isCheckingGoal, setIsCheckingGoal] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function checkGoal() {
      if (hasSeenOnboarding()) {
        setShouldRedirect(true);
        setIsCheckingGoal(false);
        return;
      }

      try {
        await getGoal();
        if (isMounted) {
          setShouldRedirect(true);
        }
      } catch (caughtError) {
        if (isNotFoundError(caughtError)) {
          if (isMounted) {
            setShouldRedirect(false);
          }
        } else if (isMounted) {
          setError(SOFT_ERROR_MESSAGE);
        }
      } finally {
        if (isMounted) {
          setIsCheckingGoal(false);
        }
      }
    }

    void checkGoal();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isCheckingGoal) {
    return (
      <AppLayout showHeader={false}>
        <Card className="startup-card">
          <LoadingState text="داریم مسیرت را بررسی می‌کنیم..." />
        </Card>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout showHeader={false}>
        <Card className="startup-card">
          <ErrorMessage message={error} />
        </Card>
      </AppLayout>
    );
  }

  return shouldRedirect ? <Navigate to="/dashboard" replace /> : <OnboardingIntroPage />;
}

export default App;
