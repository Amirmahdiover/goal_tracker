import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { ProgressBar } from "../components/ProgressBar";
import { StepCard } from "../components/StepCard";
import { TextInput } from "../components/TextInput";
import {
  addStep,
  deleteStep,
  getGoal,
  getGoalSummary,
  getSteps,
  isNotFoundError,
  SOFT_ERROR_MESSAGE,
} from "../lib/api";
import type { Goal, GoalSummary, Step } from "../types";

export function DashboardPage() {
  const navigate = useNavigate();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [summary, setSummary] = useState<GoalSummary | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddStep, setShowAddStep] = useState(false);
  const [stepTitle, setStepTitle] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [unit, setUnit] = useState("");
  const [isAddingStep, setIsAddingStep] = useState(false);

  async function loadDashboard() {
    try {
      const currentGoal = await getGoal();
      setGoal(currentGoal);

      const [goalSummary, goalSteps] = await Promise.all([
        getGoalSummary(),
        getSteps(),
      ]);
      setSummary(goalSummary);
      setSteps(goalSteps);
    } catch (caughtError) {
      if (isNotFoundError(caughtError)) {
        setGoal(null);
        setSummary(null);
        setSteps([]);
      } else {
        setError(SOFT_ERROR_MESSAGE);
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, []);

  async function handleAddStep(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTitle = stepTitle.trim();
    const cleanUnit = unit.trim();
    const cleanTarget = Number(targetValue);

    if (!cleanTitle || cleanTarget <= 0 || !cleanUnit) {
      setError("عنوان، مقدار و واحد قدم را کامل کن.");
      return;
    }

    if (steps.length >= 5) {
      setError("فعلاً همین چند قدم برای شروع کافی است.");
      return;
    }

    try {
      const usedOrderIndexes = new Set(steps.map((step) => step.order_index));
      let nextOrderIndex = 1;
      while (usedOrderIndexes.has(nextOrderIndex)) {
        nextOrderIndex += 1;
      }

      setIsAddingStep(true);
      setError("");
      await addStep({
        title: cleanTitle,
        target_value: cleanTarget,
        unit: cleanUnit,
        order_index: nextOrderIndex,
      });
      setStepTitle("");
      setTargetValue("");
      setUnit("");
      setShowAddStep(false);
      await loadDashboard();
    } catch {
      setError(SOFT_ERROR_MESSAGE);
    } finally {
      setIsAddingStep(false);
    }
  }

  async function handleDeleteStep(stepId: number) {
    const confirmed = window.confirm("این قدم حذف شود؟");
    if (!confirmed) {
      return;
    }

    try {
      setError("");
      await deleteStep(stepId);
      await loadDashboard();
    } catch {
      setError(SOFT_ERROR_MESSAGE);
    }
  }

  return (
    <AppLayout title="داشبورد">
      {isLoading ? <section className="card">در حال آماده‌سازی...</section> : null}

      {!isLoading && error ? <p className="error-banner">{error}</p> : null}

      {!isLoading && !goal ? (
        <EmptyState
          title="هنوز هدف فعالی نداری."
          description="می‌توانی از یکی از نگرانی‌هایت یک مسیر کوچک بسازی."
          action={
            <Button type="button" onClick={() => navigate("/concerns/select")}>
              ساخت هدف
            </Button>
          }
        />
      ) : null}

      {!isLoading && goal ? (
        <div className="stack">
          <section className="card">
            <p className="eyebrow">هدف فعلی</p>
            <h1>{goal.title}</h1>
            <div className="progress-summary">
              <strong>{Math.round(summary?.progress_percent ?? 0)}٪</strong>
              <ProgressBar value={summary?.progress_percent ?? 0} />
            </div>
            <p className="description">تو در حال حرکت هستی. قدم کوچک هم مهم است.</p>
          </section>

          <section className="toolbar-card">
            <Button
              type="button"
              variant="secondary"
              disabled={steps.length >= 5}
              onClick={() => setShowAddStep((current) => !current)}
            >
              + اضافه کردن قدم
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/tracking/history")}
            >
              تاریخچه پیشرفت
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate("/concerns")}>
              نگرانی‌های من
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate("/goal/edit")}>
              ویرایش هدف
            </Button>
          </section>

          {showAddStep ? (
            <form className="card stack" onSubmit={handleAddStep}>
              <h2>قدم تازه</h2>
              <TextInput
                label="عنوان قدم"
                value={stepTitle}
                onChange={(event) => setStepTitle(event.target.value)}
                placeholder="یک قدم سبک و قابل انجام"
              />
              <TextInput
                label="مقدار هدف"
                type="number"
                min="0"
                step="0.1"
                inputMode="decimal"
                value={targetValue}
                onChange={(event) => setTargetValue(event.target.value)}
              />
              <TextInput
                label="واحد"
                value={unit}
                onChange={(event) => setUnit(event.target.value)}
                placeholder="مثلاً دقیقه"
              />
              <Button type="submit" disabled={isAddingStep}>
                {isAddingStep ? "در حال ثبت..." : "ثبت قدم"}
              </Button>
            </form>
          ) : null}

          {steps.length === 0 ? (
            <EmptyState
              title="هنوز قدمی برای این هدف نداری."
              description="برای شروع، یک قدم هم کافی است."
              action={
                <Button type="button" onClick={() => setShowAddStep(true)}>
                  اضافه کردن قدم
                </Button>
              }
            />
          ) : (
            <section className="steps-list">
              {steps.map((step) => (
                <StepCard
                  key={step.id}
                  step={step}
                  onTrack={(stepId) => navigate(`/tracking/add/${stepId}`)}
                  onDelete={handleDeleteStep}
                />
              ))}
            </section>
          )}
        </div>
      ) : null}
    </AppLayout>
  );
}
