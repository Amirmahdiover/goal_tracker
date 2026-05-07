import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { Button } from "../components/Button";
import { TextArea } from "../components/TextArea";
import { TextInput } from "../components/TextInput";
import {
  createTracking,
  getSteps,
  isNotFoundError,
  SOFT_ERROR_MESSAGE,
} from "../lib/api";
import type { Step } from "../types";

function today() {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

export function AddTrackingPage() {
  const { stepId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step | null>(null);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStep() {
      try {
        const steps = await getSteps();
        const foundStep = steps.find((item) => item.id === Number(stepId));
        setStep(foundStep ?? null);
      } catch (caughtError) {
        setError(isNotFoundError(caughtError) ? "قدم پیدا نشد." : SOFT_ERROR_MESSAGE);
      } finally {
        setIsLoading(false);
      }
    }

    void loadStep();
  }, [stepId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanAmount = Number(amount);

    if (!step || cleanAmount <= 0 || !date) {
      setError("مقدار و تاریخ را کامل کن.");
      return;
    }

    try {
      setError("");
      setIsSubmitting(true);
      await createTracking({
        step_id: step.id,
        amount: cleanAmount,
        date,
        note: note.trim() || null,
      });
      navigate("/dashboard");
    } catch {
      setError(SOFT_ERROR_MESSAGE);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppLayout title="ثبت پیشرفت">
      <section className="card">
        <h1>ثبت پیشرفت</h1>

        {isLoading ? <p className="muted">در حال آماده‌سازی...</p> : null}
        {error ? <p className="error-banner">{error}</p> : null}

        {!isLoading && step ? (
          <form className="stack" onSubmit={handleSubmit}>
            <div className="selected-note">
              <strong>{step.title}</strong>
              <span>واحد: {step.unit}</span>
            </div>

            <TextInput
              label="مقدار"
              type="number"
              min="0"
              step="0.1"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
            <TextInput
              label="تاریخ"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
            <TextArea
              label="یادداشت"
              rows={4}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="اگر دوست داشتی، یک توضیح کوتاه بنویس."
            />

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "در حال ثبت..." : "ثبت"}
            </Button>
          </form>
        ) : null}
      </section>
    </AppLayout>
  );
}
