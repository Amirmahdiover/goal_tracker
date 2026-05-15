import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { EmptyState } from "../components/EmptyState";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingState } from "../components/LoadingState";
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
import { TEXT_LIMITS, TEXT_LIMIT_MESSAGE, isOverTextLimit } from "../lib/textLimits";
import type { Goal, GoalSummary, Step } from "../types";

function celebrationKey(goalId: string) {
  return `goalStrategyCelebrated:${goalId}`;
}

function playSoftCelebrationSound() {
  type AudioWindow = Window & {
    webkitAudioContext?: typeof AudioContext;
  };

  const AudioContextConstructor =
    window.AudioContext || (window as AudioWindow).webkitAudioContext;

  if (!AudioContextConstructor) {
    return;
  }

  try {
    const audioContext = new AudioContextConstructor();
    void audioContext.resume().catch(() => undefined);
    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0.001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.045, audioContext.currentTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.9);
    gain.connect(audioContext.destination);

    [523.25, 659.25, 783.99].forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(
        frequency,
        audioContext.currentTime + index * 0.12,
      );
      oscillator.connect(gain);
      oscillator.start(audioContext.currentTime + index * 0.12);
      oscillator.stop(audioContext.currentTime + 0.95);
    });

    window.setTimeout(() => {
      void audioContext.close().catch(() => undefined);
    }, 1200);
  } catch {
    // Sound is optional; browsers may block it until the user interacts.
  }
}

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
  const [showCelebration, setShowCelebration] = useState(false);

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

  useEffect(() => {
    const progress = summary?.progress_percent ?? 0;
    if (!goal || progress < 100) {
      return;
    }

    const key = celebrationKey(goal.id);
    if (localStorage.getItem(key)) {
      return;
    }

    localStorage.setItem(key, "true");
    const showTimerId = window.setTimeout(() => setShowCelebration(true), 0);
    const soundTimerId = window.setTimeout(playSoftCelebrationSound, 950);

    return () => {
      window.clearTimeout(showTimerId);
      window.clearTimeout(soundTimerId);
    };
  }, [goal, summary?.progress_percent]);

  async function handleAddStep(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTitle = stepTitle.trim();
    const cleanUnit = unit.trim();
    const cleanTarget = Number(targetValue);

    if (!cleanTitle || cleanTarget <= 0 || !cleanUnit) {
      setError("برای این قدم، اسم، مقدار و واحد را خالی نگذار.");
      return;
    }

    if (
      isOverTextLimit(cleanTitle, TEXT_LIMITS.stepTitle) ||
      isOverTextLimit(cleanUnit, TEXT_LIMITS.customUnit)
    ) {
      setError(TEXT_LIMIT_MESSAGE);
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
    const confirmed = window.confirm("مطمئنی می‌خواهی این قدم را از مسیرت برداری؟");
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
    <AppLayout title="خانه مسیر">
      {isLoading ? (
        <Card>
          <LoadingState text="داریم مسیرت را می‌آوریم..." />
        </Card>
      ) : null}

      {!isLoading ? <ErrorMessage message={error} /> : null}

      {!isLoading && !goal ? (
        <EmptyState
          title="هنوز مسیر فعالی نداری."
          description="می‌توانی یک هدف جدید بسازی، یا اول نگرانی‌هایت را کمی مرتب کنی."
          action={
            <div className="empty-actions">
              <Button type="button" onClick={() => navigate("/concerns/select")}>
                ساخت هدف جدید
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate("/concerns")}
              >
                نگرانی‌های من
              </Button>
            </div>
          }
        />
      ) : null}

      {!isLoading && goal ? (
        <div className="stack">
          <Card className="goal-summary-card">
            <p className="eyebrow">مسیر فعلی ت,,,و</p>
            <h1>{goal.title}</h1>
            <div className="progress-summary">
              <div>
                <span>این مسیر تا اینجا</span>
                <strong>{Math.round(summary?.progress_percent ?? 0)}٪</strong>
              </div>
              <ProgressBar value={summary?.progress_percent ?? 0} />
            </div>
            <p className="supportive-line">
              تو در حال حرکت هستی. همین قدم‌های کوچک هم ارزش دارند.
            </p>
          </Card>

          <section className="quick-actions" aria-label="راه‌های سریع">
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
              یادداشت‌های من
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate("/goal/edit")}>
              ویرایش مسیر
            </Button>
          </section>

          {showAddStep ? (
            <Card className="stack" variant="soft">
              <h2>یک قدم تازه</h2>
              <p className="muted">اگر مسیرت زیادی سنگین شده، می‌توانی آن را کوچک‌تر کنی.</p>
              <form className="stack" onSubmit={handleAddStep}>
                <TextInput
                  label="اسم این قدم"
                  value={stepTitle}
                  maxLength={TEXT_LIMITS.stepTitle}
                  onChange={(event) => setStepTitle(event.target.value)}
                  placeholder="مثلاً ۵ دقیقه جمع‌وجور کردن میز"
                />
                <TextInput
                  label="مقدار سبک"
                  type="number"
                  min="0"
                  step="0.1"
                  inputMode="decimal"
                  value={targetValue}
                  onChange={(event) => setTargetValue(event.target.value)}
                  placeholder="مثلاً ۳"
                />
                <TextInput
                  label="واحد"
                  value={unit}
                  maxLength={TEXT_LIMITS.customUnit}
                  onChange={(event) => setUnit(event.target.value)}
                  placeholder="مثلاً دقیقه"
                />
                <Button type="submit" isLoading={isAddingStep}>
                  {isAddingStep ? "داریم نگهش می‌داریم..." : "اضافه کردن این قدم"}
                </Button>
              </form>
            </Card>
          ) : null}

          {steps.length === 0 ? (
            <EmptyState
              title="هنوز قدمی برای این مسیر نداری."
              description="برای شروع، یک قدم هم کافی است."
              action={
                <Button type="button" onClick={() => setShowAddStep(true)}>
                  یک قدم کوچک اضافه کن
                </Button>
              }
            />
          ) : (
            <section className="steps-list" aria-label="قدم‌های مسیر">
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

      {showCelebration ? (
        <div className="celebration-overlay" role="dialog" aria-modal="true">
          <Card className="celebration-card">
            <div className="celebration-burst" aria-hidden="true">
              {Array.from({ length: 12 }).map((_, index) => (
                <span key={index} />
              ))}
            </div>
            <p className="eyebrow">مسیر کامل شد</p>
            <h2>تبریک، به هدفت رسیدی! 🎉</h2>
            <p>
              پیشرفت‌های کوچکی که ثبت کردی، کم‌کم این مسیر را کامل کردند. آفرین
              به تو.
            </p>
            <Button type="button" onClick={() => setShowCelebration(false)}>
              خیلی خوبه
            </Button>
          </Card>
        </div>
      ) : null}
    </AppLayout>
  );
}
