import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingState } from "../components/LoadingState";
import { PageHeader } from "../components/PageHeader";
import { TextArea } from "../components/TextArea";
import { TextInput } from "../components/TextInput";
import {
  createTracking,
  getSteps,
  isNotFoundError,
  SOFT_ERROR_MESSAGE,
} from "../lib/api";
import { TEXT_LIMITS, TEXT_LIMIT_MESSAGE, isOverTextLimit } from "../lib/textLimits";
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
        setError(isNotFoundError(caughtError) ? "این قدم را پیدا نکردیم." : SOFT_ERROR_MESSAGE);
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
      setError("مقدار و تاریخ را خالی نگذار؛ همین دو مورد کافی است.");
      return;
    }

    if (isOverTextLimit(note.trim(), TEXT_LIMITS.trackingNote)) {
      setError(TEXT_LIMIT_MESSAGE);
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
    <AppLayout title="پیشرفتت را ثبت کن">
      <Card>
        <PageHeader
          eyebrow="برای همین بخش از مسیر"
          title="پیشرفتت را ثبت کن"
          description="مقداری که انجام دادی را برای این بخش از مسیرت وارد کن."
        />

        {isLoading ? <LoadingState text="داریم این قدم را پیدا می‌کنیم..." /> : null}
        <ErrorMessage message={error} />

        {!isLoading && step ? (
          <form className="stack" onSubmit={handleSubmit}>
            <div className="selected-note tracking-step-note">
              <span>این قدم</span>
              <strong>{step.title}</strong>
              <small>واحد: {step.unit}</small>
            </div>

            <TextInput
              className="amount-input"
              label={`چقدر جلو رفتی؟ (${step.unit})`}
              type="number"
              min="0"
              step="0.1"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="۰"
            />
            <TextInput
              label="برای چه روزی؟"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
            <TextArea
              label="یادداشت کوچک، اگر دوست داشتی"
              rows={4}
              value={note}
              maxLength={TEXT_LIMITS.trackingNote}
              onChange={(event) => setNote(event.target.value)}
              placeholder="مثلاً امروز سبک‌تر از چیزی بود که فکر می‌کردم."
              hint="می‌توانی این قسمت را خالی بگذاری."
            />

            <Button type="submit" isLoading={isSubmitting}>
              {isSubmitting ? "داریم نگهش می‌داریم..." : "ثبت پیشرفت"}
            </Button>
          </form>
        ) : null}
      </Card>
    </AppLayout>
  );
}
